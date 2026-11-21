// New Orleans — a TO DO list in the French Quarter.
// The level (set + data) and its mechanic live together in this file so the level can be edited without touching the others.
//
// Map: river at the bottom of the screen, Canal Street on the left, the way the Quarter is drawn on tourist maps.
// River-parallel streets, top to bottom: Bourbon, Royal, Chartres, Decatur, then the riverfront.
// Cross streets, left to right: Canal, Conti, St. Louis, Toulouse, St. Peter, St. Ann, Dumaine
// (Iberville and Bienville, between Canal and Conti, are left out to keep the walk short).
import { THREE, $, world, scene, Input, Cam, UI, Sfx, fade, rumble, clamp } from './engine.js';
import { Batch, tree, lamp, sky, ambient, makeChar, sign, items, FX } from './kit.js';

const IRON = 0x24222c, WOOD = 0x8a5a36, SLATE = 0x4a4e5a, CREAM = 0xf2efe6;
const CREOLE = [0xe89a78, 0xf2d27a, 0x9ac0cc, 0xd98a9a, 0xb8d0a0, 0xe8c8a0, 0xc8a8d0, 0xf0b060, 0xa8c8b0], SHUTTERS = [0x2f6a58, 0x2a4a7a, 0x7a2a2a, 0x3a3a44];
const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/* ───────── the street grid ───────── */
const NS = [['CANAL', -54, 4], ['CONTI', -36, 2.5], ['ST. LOUIS', -18, 2.5], ['TOULOUSE', 0, 2.5], ['ST. PETER', 18, 2.5], ['ST. ANN', 36, 2.5], ['DUMAINE', 54, 2.5]];
const EW = [['BOURBON', -30], ['ROYAL', -15], ['CHARTRES', 0], ['DECATUR', 15]];
const ROWS = { A: [-27.5, -17.5], B: [-12.5, -2.5], C: [2.5, 12.5] }, WALK = 1.1;         // block rows between the streets; WALK = sidewalk depth
const colX = (c) => [NS[c][1] + NS[c][2], NS[c + 1][1] - NS[c + 1][2]];
const CITY = [-57.6, 56.3, -33.2, 34.2];
const RX = 0, RZ = 420, ROOM = [RX - 4.1, RX + 4.1, RZ - 2.9, RZ + 3.1];                      // the hotel room is its own little set, far from the map

/* ───────── the list ───────── */
const WEED = 0, GATOR = 1, HILTON = 2, BOAT = 3, FOOD = 4, GIFTS = 5;
const LIST = [
  { t: 'Get WEED', id: WEED },
  { t: 'FIND ADVENTURE', group: [GATOR, HILTON, BOAT] },
  { t: 'book the alligator ride', id: GATOR, sub: true },
  { t: 'book the Hilton trip', id: HILTON, sub: true },
  { t: 'book the steamboat ride', id: BOAT, sub: true },
  { t: 'GET FOOD', id: FOOD },
  { t: 'BUY GIFTS', id: GIFTS },
];
const OPENING = [   // [speaker, line, how many list lines are written once this line is on screen]
  ['hotel room', 'Yellow walls, big bed, shades drawn. Pad on the table. Write the list.', 0],
  ['to do', '— Get WEED.', 1],
  ['to do', '— FIND ADVENTURE: the alligator ride, the Hilton trip, the steamboat ride.', 5],
  ['to do', '— GET FOOD.', 6],
  ['to do', '— BUY GIFTS.', 7],
  ['to do', 'That is the day. Adventure is the man in the life vest at the dock. The door is on the right. B opens the map.', 7],
];
const CAT = {
  weed: { obj: WEED, label: 'weed', col: 0x4fae6a, css: '#58c878' },
  food: { obj: FOOD, label: 'food', col: 0xe5484d, css: '#ff8a5a' },
  gift: { obj: GIFTS, label: 'gifts', col: 0x9a5ad0, css: '#c08aff' },
};
const WALLET = 300, OBJ_PTS = 10, TIP_PTS = 2;
/* ───────── FIND ADVENTURE: three scenes, played in this order from the dock guy's clipboard ─────────
   1 · the Hilton trip: a two-hour timeshare pitch. Nothing can go wrong in it; every reply is a good one.
   2 · the Airboat Alligator Race.
   3 · the Steamboat Natchez: the ending. Wander, eat, look at the city, leave when you like. */
const ADVENTURES = [
  { id: HILTON, n: 'The Hilton trip', $: 0 },
  { id: GATOR, n: 'Airboat Alligator Race', $: 50 },      // three races, see COURSES
  { id: BOAT, n: 'Steamboat Natchez', $: 60 },
];
/* The pitch. Add or change lines freely: each round is one thing they say and the replies you can pick from.
   A reply is [what you say, what they say back]. Rounds with manager: true are spoken by the manager, who walks in for them. */
const PITCH = [
  { clock: '0:05', line: 'Welcome, lovebirds! Mimosas are free. This will only take ninety minutes.', replies: [
    ['We were promised a steamboat.', 'And you will get one. After a few slides.'],
    ['Define "only".', 'Ha! I like you two. Sit, sit.'],
    ['Is the mimosa also a timeshare?', 'Everything is a timeshare if you believe.']] },
  { clock: '0:25', line: 'Picture it: one week a year, every year, forever. What does your dream vacation look like?', replies: [
    ['This, but without you in it.', 'Ha! Great energy. Next slide.'],
    ['A hotel we can check out of.', 'Ownership means never checking out. Think about that.'],
    ['Forever is a long time for a Tuesday.', 'Forever is a lifestyle.']] },
  { clock: '0:50', line: 'Now, what do you two spend on hotels a year? Ballpark it for me.', replies: [
    ['Less than this is costing us in daylight.', 'Time is money. Which is why you should own some.'],
    ['We sleep in the car. Next question.', 'Then imagine a car with a lobby!'],
    ['We came for the free tickets, sir.', 'Everyone does. Ninety percent still buy. That is not true, but it feels true.']] },
  { clock: '1:15', line: 'I should not do this, but today only, I can take forty percent off. Today. Only.', replies: [
    ['What is it tomorrow?', 'Tomorrow it is also forty percent off. But a different forty.'],
    ['Take off a hundred and we will think about it.', 'You are funny. She is funny. Is he always funny?'],
    ['Can we have forty percent off the meeting?', 'We are almost done. We are not almost done.']] },
  { manager: true, clock: '1:40', line: 'Folks. I am the manager. He tells me you are on the fence. Let me ask you something. How long have you been married?', replies: [
    ['Since this meeting started. It has aged us.', '... I am going to get my manager.'],
    ['Long enough to share one braincell. It says no.', 'That is a very united front.'],
    ['We are not. Sell us that instead.', 'I do not have a slide for that.']] },
  { manager: true, clock: '1:55', line: 'Last offer. Every other year. Off season. A studio. Facing the parking structure.', replies: [
    ['Does it have a view of us leaving?', 'It does. It is our best feature.'],
    ['We will take the free tickets and the pen.', 'The pen stays.'],
    ['No. But warmly.', 'Warmly noted.']] },
];
const PITCH_END = [['the sales guy', '... Okay. Here are your vouchers. You two are a tough room.'], ['', 'Two hours. Zero timeshares. You kept the pen.']];
const PX = 0, PZ = 620;                                                                 // the Hilton conference room
/* The Airboat Alligator Race is a cup: three courses, raced in order, each a loop you lap.
   wave: the bends, as [how far it swings, how many times per lap, phase]. pace: how fast the other boats go. */
const RACE_PTS = [10, 7, 4, 2], ORD = ['1st', '2nd', '3rd', '4th'];
const RACE_END = ['First across the line. The gators are filing a complaint.', 'Second. Close enough to taste the swamp water.', 'Third. The boat is fine. The pride will recover.', 'Last, but nobody got eaten. A clean race.'];
const SWZ = 950, STEP = 8;                                                                  // every course starts at z = SWZ and runs up the screen
const COURSES = [
  { name: 'Honey Island Warm-Up', blurb: 'Wide water, lazy bends, sleepy gators.', x: -700, L: 264, laps: 2, hw: 6.5, wave: [[6, 2, 0], [1.5, 5, 1]], gators: 4, logs: 2, rings: 3, pace: 14.2, water: 0x4a6a52 },
  { name: 'Gator Alley', blurb: 'Narrow, twisty, and they are awake.', x: -1000, L: 304, laps: 3, hw: 5.4, wave: [[7, 3, .5], [1.5, 7, 2]], gators: 9, logs: 4, rings: 4, pace: 15, water: 0x3f6a4a },
  { name: 'Midnight Bayou', blurb: 'After dark. Lanterns on the banks, eyes in the water.', x: -1300, L: 344, laps: 3, hw: 5.8, wave: [[8, 3, 1], [2, 8, 0]], gators: 8, logs: 5, rings: 5, pace: 15.7, water: 0x24344a, night: true },
];
const lane = (C, z) => C.x + C.wave.reduce((a, [A, k, ph]) => a + A * Math.sin((SWZ - z) / C.L * 6.2832 * k + ph), 0);    // the channel's centre line; repeats every lap
/* vmax: top speed. steer: how fast it slides sideways. acc: how quickly it gets back up to speed. boost: seconds per boost. bump: speed left after hitting a gator. seat: how high the driver sits. */
const BOATS = [
  { n: 'Swamp Skimmer', hint: 'airboat · does everything', vmax: 16, steer: 9, acc: 1.4, boost: 1.3, bump: 5, seat: .62 },
  { n: 'Gator Tail', hint: 'mud boat · grippy, shrugs off gators', vmax: 14.8, steer: 12.5, acc: 2.2, boost: 1.3, bump: 11, seat: .3 },
  { n: 'Bayou Rocket', hint: 'speedboat · fast, wide turns', vmax: 18, steer: 6.8, acc: 1, boost: 1.1, bump: 4, seat: .32 },
];
const BX = 700, BZ = 420, DECK = [BX - 11.4, BX + 11.4, BZ - 3.5, BZ + 3.5];              // the steamboat's deck
const CRUISE_OPEN = [['', 'The Natchez pulls off the wharf at sunset, red paddlewheel turning.'], ['', 'Nothing to win here. Eat, wander, look at the city. Talk to the captain, or press B, when you want to call it a night.']];
const CRUISE_END = [['', 'The boat turns for the wharf. The first fat drops hit the deck.'], ['', 'Powdered sugar in a thunderstorm.']];
const BUFFET = [['bread pudding, whiskey sauce', 'Warm. Dangerous.'], ['a cup of gumbo', 'Somebody\'s grandmother is in this.'], ['bananas Foster', 'They set it on fire first. Correct.']];
const CRUISE_SPOTS = [   // [x, z, label, lines]: little things to do on deck, each worth points once
  [-5, 2.5, 'the jazz trio', ['Three old men and a tune older than the boat. You sway a little.']],
  [9.6, 2.3, 'the bar', ['Two hurricanes, in the souvenir glasses, obviously.']],
  [10.6, -2, 'the paddlewheel', ['Red paddles, brown water, white foam. You watch it longer than you meant to.']],
];
const VIEW = ['The Quarter slides by: gallery lights, the three spires, one stubborn trumpet somewhere on Decatur.', 'Nobody is selling you anything. Stay as long as you like.'];
/* row: which block face the shop sits on (N = far side of Bourbon, A faces Royal, B faces Chartres, C faces Decatur). items: [name, price, points] */
const SHOPS = [
  { cat: 'weed', row: 'C', x: -27, name: 'CRESCENT CITY HEMP', keeper: 'budtender', hi: 'Welcome in. Everything is lab tested, allegedly.', look: { top: 0x4fae6a, hair: 0x3a2a20, cap: 0x2a2a33 },
    items: [['pre-roll two-pack', 15, 3], ['gummies, the good tin', 25, 5], ['an eighth of Purple Rain', 40, 9]] },
  { cat: 'weed', row: 'N', x: -44, name: 'BOURBON SMOKE SHOP', keeper: 'guy behind the glass', hi: 'Tourist prices, baby. It is Bourbon Street.', look: { top: 0x2a2a33, hair: 0xc8a050, style: 'long' },
    items: [['mystery pre-roll', 20, 2], ['tourist-priced eighth', 60, 8]] },
  { cat: 'weed', row: 'A', x: 45, name: 'VOODOO BUDS', keeper: 'Miss Odette', hi: 'The house blend is called Gris-Gris. It works.', look: { top: 0x8a5ad0, skin: 0x9a6a48, hair: 0x1a1412, style: 'bun' },
    items: [['house blend "Gris-Gris"', 30, 8], ['hemp pralines', 18, 4]] },
  { cat: 'food', row: 'C', x: 45, name: 'CENTRAL GROCERY', keeper: 'counterman', hi: 'Muffuletta. Whole or half. That is the menu.', look: { top: 0xf2efe6, hair: 0x555060, beard: 0x555060 },
    items: [['whole muffuletta', 28, 9], ['half muffuletta', 16, 5], ["Zapp's chips", 3, 1]] },
  { cat: 'food', row: 'B', x: -44, name: 'PO-BOYS', keeper: 'Ms. Dot', hi: 'Dressed? Say yes, sugar.', look: { top: 0xffd27a, skin: 0xb9794f, hair: 0x1a1412, style: 'curly' },
    items: [['shrimp po-boy, dressed', 16, 6], ['roast beef debris po-boy', 15, 6], ["Barq's root beer", 3, 1]] },
  { cat: 'gift', row: 'A', x: -9, name: 'MASKS & FEATHERS', keeper: 'mask maker', hi: 'Every one made by hand. Try the purple.', look: { top: 0xb04ad9, hair: 0x6b3a24, style: 'long' },
    items: [['feathered Mardi Gras mask', 35, 8], ['beads, the fancy ones', 8, 2]] },
  { cat: 'gift', row: 'N', x: 42, name: 'VOODOO SHOP', keeper: 'shopkeeper', hi: 'Take what calls to you. Pay for it, though.', look: { top: 0x3a1a3a, skin: 0xd59a70, hair: 0x1a1412, style: 'long' },
    items: [['gris-gris bag for luck', 12, 4], ['voodoo doll (friendly)', 15, 4]] },
  { cat: 'gift', row: 'C', x: 9, name: 'PRALINES', keeper: 'candy lady', hi: 'Still warm. Have a sample, baby.', look: { top: 0xff9ab8, skin: 0x9a6a48, hair: 0x555060, style: 'bun' },
    items: [['box of pralines', 14, 5], ['hot sauce sampler', 12, 3], ['fleur-de-lis magnet', 4, 1]] },
  // these three are not storefronts: a cart, the café pavilion, and the artists on the Jackson Square fence
  { cat: 'food', at: [27, -31.7], name: 'LUCKY DOGS', keeper: 'hot dog man', hi: 'One with everything?', look: { top: 0xe5484d, hair: 0x3a2a20, cap: 0xffd27a },
    items: [['Lucky Dog, everything on it', 7, 2]] },
  { cat: 'food', at: [38.5, 18.4], name: 'CAFÉ DU MONDE', keeper: 'waiter', hi: 'Beignets come in threes. Do not inhale the sugar.', look: { top: 0xf2efe6, hair: 0x1a1412, cap: 0xf2efe6 },
    items: [['beignets, order of three', 5, 4], ['café au lait, two', 8, 3], ['frozen café au lait', 7, 2]] },
  { cat: 'gift', at: [25.4, 13.3], name: 'JACKSON SQUARE ARTISTS', keeper: 'painter', hi: 'Painted right here on the fence. The cathedral sells best.', look: { top: 0x3d8bd9, hair: 0xc8a050, style: 'bun' },
    items: [['small painting of the Cathedral', 45, 10], ['caricature of you two', 20, 6]] },
];
const HOTEL = { row: 'B', x: -9, name: 'HOTEL', wall: 0xf2cc4a, hotel: true };
const DOCK = { x: -3, z: 32.9, name: 'man in the life vest', look: { top: 0xff7a1a, zip: 0xffe27a, hair: 0x3a2a20, cap: 0x2a4a7a, beard: 0x3a2a20 } };
const BUSKERS = [   // street people you can stop for: A tips a dollar
  { id: 0, x: 9.3, z: -16.7, name: 'brass band', line: 'A second-line stomp that rattles the shutters up and down Royal.' },
  { id: 1, x: -12, z: -30, name: 'second-line dancers', line: 'They pull you in for eight bars. You are not bad.' },
  { id: 2, x: 23.2, z: -1.3, name: 'living statue', line: 'Silver from hat to shoes. He does not blink. Then he winks.' },
  { id: 3, x: 30.8, z: -1.1, name: 'tarot reader', line: 'She turns one card. The Lovers. Obviously.' },
  { id: 4, x: 16, z: -31.3, name: 'tap dancer', line: 'Bottle caps on his sneakers, faster than the drummer.' },
  { id: 5, x: -22, z: 23.6, name: 'sax on the Moonwalk', line: 'One slow tune, out over the river.' },
];
const STROLL = [[[-48, -30.6], [50, -29.4], 2], [[-45, -15.8], [48, -14.2], 1.7], [[50, .8], [-46, -.8], 2.1], [[-40, 15.6], [52, 14.5], 1.8], [[0, -28], [0, 22], 1.9], [[36.6, -28], [35.4, 16], 1.6], [[-36, 14], [-36, -29], 2.2], [[18, -29], [18, 16], 1.7], [[-50, 24.6], [30, 24.9], 1.5], [[-52, -28], [-56, 20], 2]];

/* ───────── set building ───────── */
function facades(b, x0, x1, zf, depth, seed, shops, place) {      // a row of Creole townhouses whose fronts (at z = zf) face the camera
  const n = Math.max(1, Math.round((x1 - x0) / 4.3)), w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const cx = x0 + w * (i + .5), r = hash(seed * 31 + i), r2 = hash(seed * 17 + i * 3 + 5), shop = shops.find((s) => s.x >= cx - w / 2 && s.x < cx + w / 2);
    const col = (shop && shop.wall) || CREOLE[(r * CREOLE.length) | 0], H = 4.3 + ((r2 * 3) | 0) * .45, sh = SHUTTERS[(r2 * 7 | 0) % SHUTTERS.length], zc = zf - depth / 2;
    b.box(cx, 0, zc, w - .08, H, depth, col); b.box(cx, H, zc, w + .1, .2, depth + .2, CREAM); b.box(cx, H + .2, zc, w - .4, .12, depth - .4, 0x5a5560);
    for (let k = -1; k <= 1; k++) { const wx = cx + k * w * .3;
      b.box(wx, 2.72, zf + .02, .6, 1.3, .05, (i + k + seed) % 4 ? 0x3a4458 : 0xffe2b0); b.box(wx - .44, 2.72, zf + .03, .24, 1.3, .06, sh); b.box(wx + .44, 2.72, zf + .03, .24, 1.3, .06, sh);     // upstairs french doors
      b.box(wx, .08, zf + .02, .72, 1.95, .05, k || shop ? 0x3a4458 : 0x4a3226); }
    if (shop) { place(shop, cx, w, zf); continue; }
    if (r > .22) {                                                                                                                    // cast-iron gallery over the sidewalk
      b.box(cx, 2.42, zf + .5, w - .08, .1, 1, 0x3a3540); b.box(cx, 3.2, zf + .97, w - .08, .05, .05, IRON);
      const nb = Math.round(w / .5); for (let k = 0; k <= nb; k++) b.box(cx - w / 2 + .06 + k * (w - .12) / nb, 2.52, zf + .97, .04, .7, .04, IRON);
      for (const sx of [-1, 1]) { b.box(cx + sx * (w / 2 - .12), .06, zf + .95, .08, 2.36, .08, IRON); b.ball(cx + sx * w * .24, 3.34, zf + .97, .24, 0x3f9a52, 0, .7); }
      if (r2 > .6) b.ball(cx, 3.36, zf + .97, .16, 0xff7ab6, 0, .8);
    } else { b.box(cx, 2.5, zf + .25, w * .6, .08, .5, 0x3a3540); b.box(cx, 3.1, zf + .48, w * .6, .05, .05, IRON); for (let k = -2; k <= 2; k++) b.box(cx + k * w * .14, 2.58, zf + .48, .04, .52, .04, IRON); }
  }
}
function cottages(b, x0, x1, z0, z1, seed) {                       // low Creole cottages on the far side of each block, so the street behind stays visible
  const n = Math.max(1, Math.round((x1 - x0) / 3.6)), w = (x1 - x0) / n, d = z1 - z0, zc = (z0 + z1) / 2;
  for (let i = 0; i < n; i++) { const cx = x0 + w * (i + .5), r = hash(seed * 13 + i * 7 + 2), H = 2.3 + r * .5;
    b.box(cx, 0, zc, w - .08, H, d, CREOLE[(r * 97 | 0) % CREOLE.length]); const rf = [0xa8604a, 0x6a6a78, 0x5a7a6a, 0x8a5a4a, 0x70707c][(r * 131 | 0) % 5];
    b.box(cx, H, zc, w + .12, .16, d + .24, rf); b.box(cx, H + .16, zc, w - .5, .22, d * .55, rf); b.box(cx, H + .38, zc, w - 1.2, .16, d * .2, rf); }
}
function storefront(b, s, cx, w, zf) {
  const col = s.hotel ? 0x1f5a45 : CAT[s.cat].col;
  for (let k = 0; k < 6; k++) b.box(cx - w / 2 + (k + .5) * w / 6, 2.2, zf + .5, w / 6, .08, 1.05, k % 2 ? CREAM : col, 0, 0, .22);                 // striped awning in the category colour
  const sg = sign(s.name, cx, 3.75, zf + .32, Math.min(w - .3, 3.7), .78, s.hotel ? { bg: '#1f3a2c', fg: '#ffe27a', border: '#ffe27a', glow: true } : { bg: '#1c1a24', fg: CAT[s.cat].css, border: CAT[s.cat].css, glow: true });
  sg.rotation.x = -.5;
  if (s.hotel) { b.box(cx, .08, zf + .04, 1.1, 2.1, .06, 0x4a3226); b.box(cx, 0, zf + .6, 1.6, .03, 1, 0x7a2238); for (const sx of [-1, 1]) { b.cyl(cx + sx * 1.1, 0, zf + .45, .22, .5, 0xb86a4a, .8, 6); b.ball(cx + sx * 1.1, .8, zf + .45, .34, 0x3f9a52); }
    s.door = { x: cx, z: zf + .95 }; return; }
  b.box(cx - .95, 0, zf + .42, 1.3, .8, .5, WOOD); for (let k = 0; k < 4; k++) b.ball(cx - 1.4 + k * .3, .92, zf + .42, .11, k % 2 ? col : 0xffd27a);
  s.kx = cx + .45; s.kz = zf + .62;
}
function palm(b, x, z, h = 3.2) { b.cyl(x, 0, z, .13, h, 0x8a7a5a, .7, 5); for (let k = 0; k < 5; k++) { const a = k * 1.257; b.ball(x + Math.cos(a) * .55, h + .05, z + Math.sin(a) * .55, .55, 0x3f9a52, 0, .3); } b.ball(x, h + .2, z, .3, 0x2f8a4f); }
function cafeTable(b, x, z) { b.cyl(x, 0, z, .05, .7, IRON, 1, 5); b.cyl(x, .7, z, .42, .05, 0xf2efe6, 1, 8); }

function buildRoom(b, c) {
  const Y = 0xf2cc4a, Y2 = 0xe6b93a, x = RX, z = RZ;
  b.box(x, -.4, z, 160, .08, 160, 0x16141c); b.box(x, -.3, z, 9.4, .3, 7.4, 0x8a5a3a); b.box(x - .6, 0, z + .6, 4.6, .03, 3, 0x7a2238); b.box(x - .6, .03, z + .6, 4, .01, 2.4, 0x9a3a4a);            // floorboards, rug
  b.box(x, 0, z - 3.6, 9.4, 3.3, .2, Y); b.box(x - 4.6, 0, z, .2, 3.3, 7.4, Y2); b.box(x + 4.6, 0, z, .2, 3.3, 7.4, Y2);                               // yellow walls
  b.box(x, 0, z - 3.48, 9.2, .22, .06, CREAM); b.box(x, 3.3, z - 3.6, 9.6, .14, .3, CREAM);
  // the big bed
  b.box(x - 2, 0, z - 1.5, 3.5, .45, 3.9, 0x4a3226); b.box(x - 2, .45, z - 1.45, 3.3, .35, 3.7, 0xffffff); b.box(x - 2, .78, z - .9, 3.4, .1, 2.7, 0xf0e6d0); b.box(x - 2, .86, z + .1, 3.42, .06, .5, 0x7a2238);
  b.box(x - 2.75, .8, z - 2.9, 1.2, .2, .6, 0xffffff); b.box(x - 1.25, .8, z - 2.9, 1.2, .2, .6, 0xffffff); b.box(x - 2, 0, z - 3.42, 3.7, 1.9, .14, 0x3a2418);
  b.box(x + .35, 0, z - 3.05, .7, .6, .6, 0x4a3226); b.cyl(x + .35, .6, z - 3.05, .08, .3, 0xb8905a, 1, 6); b.cyl(x + .35, .9, z - 3.05, .22, .3, 0xffe9b0, .6, 8, 1.2);          // nightstand, lamp
  // the window, shades drawn: a line of daylight leaks around the edges
  b.box(x + 2.6, 1, z - 3.47, 2.2, 1.9, .05, 0xfff6c8, 0, 1.2); b.box(x + 2.6, 1.06, z - 3.43, 2.06, 1.84, .05, 0xd8c8a0); for (let k = 0; k < 7; k++) b.box(x + 2.6, 1.12 + k * .26, z - 3.4, 2.06, .04, .03, 0xc0ae84);
  for (const sx of [-1, 1]) b.box(x + 2.6 + sx * 1.3, .5, z - 3.4, .5, 2.7, .1, 0x7a2238);
  b.box(x - 3.2, 1.6, z - 3.46, 1, .7, .05, 0x3a2418); b.box(x - 3.2, 1.66, z - 3.43, .86, .58, .05, 0x9ac0cc);                                         // a print over the bed
  // the table with the pad on it, two chairs
  b.cyl(x + 1.9, 0, z + .7, .09, .74, 0x3a2418, 1, 6); b.cyl(x + 1.9, .74, z + .7, .72, .06, 0x6a4226, 1, 10);
  b.box(x + 1.75, .8, z + .78, .32, .02, .44, 0xfff3a8, .3); b.box(x + 2.08, .81, z + .7, .04, .02, .3, 0x2a2a33, .9);
  for (const [cx, cz, ry] of [[1.05, .2, .9], [2.8, .25, -.9]]) { b.box(x + cx, 0, z + cz, .5, .45, .5, 0x4a3226, ry); b.box(x + cx - Math.sin(ry) * .22, .45, z + cz - Math.cos(ry) * .22, .5, .6, .08, 0x4a3226, ry); }
  b.box(x - 3.9, 0, z + 2.3, .9, .55, .6, 0x2a4a7a, .2); b.box(x - 3.9, .55, z + 2.3, .3, .1, .08, 0x1a1a22, .2);                                           // suitcase
  // the door, on the right wall
  b.box(x + 4.48, 0, z + 1.6, .08, 2.3, 1.2, 0x4a3226); b.box(x + 4.42, 1.05, z + 2.02, .06, .08, .08, 0xffd27a, 0, 1.2); b.box(x + 3.9, 0, z + 1.6, .9, .02, 1.1, 0x5a5a66);
  c.rects.room = [[x - 3.75, x - .25, z - 3.5, z + .45], [x, x + .7, z - 3.5, z - 2.75]];
  c.circs.room = [{ x: x + 1.9, z: z + .7, r: .7 }, { x: x - 3.9, z: z + 2.3, r: .5 }];
}

function buildCity(b, c) {
  const R = c.rects.city = [], C = c.circs.city = [], rect = (x0, x1, z0, z1) => R.push([x0, x1, z0, z1]);
  const ASPHALT = 0x55535e, PAVE = 0xb4aca6;
  b.box(0, -.5, -24, 190, .5, 100, ASPHALT); b.box(0, 0, 21.6, 118, .05, 8.2, 0xb08a70); b.box(0, 0, 25.6, 118, .3, .3, 0x8a8480);                         // streets, the brick riverfront, the levee edge
  b.box(0, -.75, 76, 320, .5, 100, 0x8a7a58); b.box(0, -.3, 122, 320, .5, 8, 0x4a7a4a); for (let k = -3; k <= 3; k++) b.box(k * 34 + 8, .2, 124, 14, 2 + (k & 1) * 2, 4, 0x8a8a9a);   // the Mississippi, Algiers on the far bank
  for (const [name, z] of EW) for (const x of [-27, 9, 45]) { const s = sign(name, x, .03, z, 5.6, 1, { bg: '#55535e', fg: '#e8e2d0', border: '#55535e' }); s.rotation.x = -Math.PI / 2; }
  for (const [name, x] of NS) for (const z of [-22.5, 7.5]) { if (x === 18 && z > 0) continue; const s = sign(name, x + (x === -54 ? 2.6 : 0), .03, z, 5, .95, { bg: '#55535e', fg: '#e8e2d0', border: '#55535e' }); s.rotation.set(-Math.PI / 2, 0, Math.PI / 2); }
  for (const [, x] of NS) for (const [, z] of EW) if (x > -50) lamp(b, x + 2.9, z - 2.9, 0xffd9a0, 2.4);

  const place = (s, cx, w, zf) => storefront(b, s, cx, w, zf), row = (k) => [...SHOPS, HOTEL].filter((s) => s.row === k);
  facades(b, -58, 57, -33.6, 5.6, 99, row('N'), place);                                                                                 // the far side of Bourbon
  for (let k = 0; k < 9; k++) b.box(-52 + k * 13, 0, -47 - (k % 3) * 3, 11, 3 + (k % 4), 9, [0x8a8290, 0x9a8a80, 0x7a8a90][k % 3]);
  for (const [k, [z0, z1]] of Object.entries(ROWS)) for (let col = 0; col < 6; col++) {
    const [x0, x1] = colX(col), i = k.charCodeAt(0) * 7 + col;
    b.box((x0 + x1) / 2, 0, (z0 + z1) / 2, x1 - x0, .05, z1 - z0, PAVE);
    if (col === 4 && k !== 'A') continue;                                                                                                // Jackson Square and the Cathedral block
    facades(b, x0 + WALK, x1 - WALK, z1 - WALK, 4.5, i, row(k).filter((s) => s.x > x0 && s.x < x1), place);
    cottages(b, x0 + WALK, x1 - WALK, z0 + WALK, z1 - WALK - 4.5, i);
    rect(x0 + WALK, x1 - WALK, z0 + WALK, z1 - WALK);
  }

  /* St. Louis Cathedral, with the Cabildo and the Presbytère either side and St. Anthony's Garden behind */
  const W = 0xe8e4dc;
  b.box(27, 0, -6, 6.4, 5.4, 4.6, W); b.box(27, 5.4, -6, 5.6, .7, 4.2, SLATE); b.box(27, 0, -4.3, 2.3, 7.6, 1.5, W); b.cone(27, 7.6, -4.3, 1.25, 5.2, SLATE, 6); b.box(27, 12.6, -4.3, .08, 1, .08, IRON); b.box(27, 13.2, -4.3, .5, .08, .08, IRON);
  for (const sx of [-1, 1]) { b.box(27 + sx * 2.5, 0, -4.3, 1.5, 6.2, 1.5, W); b.cone(27 + sx * 2.5, 6.2, -4.3, .95, 3.8, SLATE, 6); b.box(27 + sx * 2.5, 3.9, -3.53, .5, 1.1, .05, 0x3a4458); b.box(27 + sx * 2.5, .08, -3.53, .7, 1.6, .05, 0x4a3226); }
  b.box(27, .08, -3.53, 1.1, 2.3, .05, 0x4a3226); b.ball(27, 5.9, -3.5, .42, 0xfff6c8, 1.1, 1); b.box(27, 3.3, -3.53, .7, 1.3, .05, 0x3a4458);
  for (const sx of [-1, 1]) { const x = 27 + sx * 5; b.box(x, 0, -6, 3, 3.9, 4.6, 0xd8cdb8); b.box(x, 3.9, -6, 3.1, .9, 4.7, SLATE); b.box(x, 4.8, -6, 2.5, .3, 4, SLATE); b.cyl(x, 5.1, -6, .4, .8, W, 1, 6); b.cone(x, 5.9, -6, .5, .6, SLATE, 6);
    for (let k = -1; k <= 1; k++) { b.box(x + k * .9, .08, -3.67, .6, 1.5, .05, 0x3a3540); b.box(x + k * .9, 2.2, -3.67, .5, 1.1, .05, 0x3a4458); } }
  b.box(27, .05, -9.9, 10.6, .04, 3, 0x4f9a5a); for (const x of [23.5, 25.4, 28.6, 30.5]) b.ball(x, .45, -10 + (x % 2) * .5, .5, 0x2f8a4f, 0, .8); b.box(27, .05, -9.8, .5, .5, .5, W); b.box(27, .55, -9.8, .26, 1.1, .2, 0xffffff);
  rect(21.6, 32.4, -11.4, -3.7);

  /* Jackson Square: lawn, iron fence with a gate on each side, General Jackson on his horse in the middle */
  b.box(27, .05, 7.5, 11.8, .04, 8.8, 0x4f9a5a); b.box(27, .09, 7.5, 1.3, .02, 8.8, 0xd8ccb0); b.box(27, .09, 7.5, 11.8, .02, 1.3, 0xd8ccb0); b.cyl(27, .09, 7.5, 2.3, .03, 0xd8ccb0, 1, 10);
  b.box(27, 0, 7.5, 1.3, 1.5, 2.1, 0xc8c2b8); b.box(27, 1.5, 7.5, .5, .85, 1.5, 0x3d5a50, 0, 0, -.35); b.ball(27, 2.75, 7.05, .3, 0x3d5a50, 0, 1.3); b.ball(27, 2.5, 8.1, .26, 0x3d5a50); b.box(27, 1.3, 8.15, .3, 1, .3, 0x3d5a50, 0, 0, .5);
  for (const [x, z] of [[23.2, 5], [30.8, 5], [23.2, 10], [30.8, 10]]) { tree(b, x, z, .75, 0x3f9a52); C.push({ x, z, r: .3 }); }
  C.push({ x: 27, z: 7.5, r: 1.3 });
  const F = [21.1, 32.9, 3.1, 11.9];
  for (let x = F[0]; x <= F[1] + .01; x += .59) for (const z of [F[2], F[3]]) if (Math.abs(x - 27) > 1.1) b.box(x, 0, z, .05, 1.1, .05, IRON);
  for (let z = F[2]; z <= F[3] + .01; z += .55) for (const x of [F[0], F[1]]) if (Math.abs(z - 7.5) > 1.1) b.box(x, 0, z, .05, 1.1, .05, IRON);
  for (const z of [F[2], F[3]]) for (const [x0, x1] of [[F[0], 25.9], [28.1, F[1]]]) { b.box((x0 + x1) / 2, .95, z, x1 - x0, .05, .05, IRON); rect(x0, x1, z - .05, z + .05); }
  for (const x of [F[0], F[1]]) for (const [z0, z1] of [[F[2], 6.4], [8.6, F[3]]]) { b.box(x, .95, (z0 + z1) / 2, .05, .05, z1 - z0, IRON); rect(x - .05, x + .05, z0, z1); }
  for (let k = 0; k < 7; k++) b.box(22 + k * .62, .25, 11.98, .46, .6, .04, [0xe5484d, 0x3d8bd9, 0xffd27a, 0x4fae6a, 0xf2efe6, 0x8a5ad0, 0xff9ab8][k]);          // paintings hung on the fence
  b.box(24.4, 0, 12.6, .7, .9, .5, WOOD);
  // a mule carriage waiting on Decatur
  b.box(31, .5, 13.1, 1.9, .5, .9, 0x7a2238); b.box(31, 1, 13.1, 1.9, .9, .06, 0x1c1a24); b.box(31.2, 1.9, 13.1, 1.7, .06, 1, 0xf2efe6); for (const sx of [-.7, .7]) b.cyl(31 + sx, .1, 13.6, .34, .08, 0x2a2a33, 1, 8);
  b.ball(33, .75, 13.1, .42, 0x7a6248, 0, .75); b.box(33.35, .75, 13.1, .7, .45, .5, 0x7a6248); b.box(33.75, 1.05, 13.1, .28, .5, .26, 0x7a6248); b.box(33.8, 1.5, 13.1, .1, .22, .1, 0x5a4638);
  C.push({ x: 31.4, z: 13.2, r: 1.2 }, { x: 33.4, z: 13.2, r: .8 });

  /* the riverfront: Woldenberg Park, the Toulouse wharf and the steamboat, Jax Brewery, the overlook, Café du Monde */
  b.box(-33.5, .05, 21.4, 47, .03, 7.6, 0x5a9a5e); for (const x of [-52, -43, -34, -16]) { tree(b, x, 19.3, .8, 0x3f9a52); C.push({ x, z: 19.3, r: .3 }); }
  for (const x of [-46, -28]) { b.box(x, 0, 23.2, 1.5, .4, .4, WOOD); b.box(x, .4, 23, 1.5, .4, .06, WOOD); }
  // The Toulouse Street wharf. The Natchez is tied up along the levee; a pier runs round her bow to a landing float on the river side,
  // which is where the man in the life vest keeps his clipboard, so the camera looks at him with the boat behind.
  b.box(-3, .05, 22.9, 20, .06, 5.2, 0x9a7248); for (const x of [-7, -3, 1, 5]) b.cyl(x, 0, 25.3, .14, .6, 0x3a3540, 1, 6);
  b.box(-11.3, -.2, 29.8, 2.6, .28, 8.6, 0x9a7248); b.box(-4.7, -.2, 33, 15.8, .28, 2.9, 0x9a7248); for (const [x, z] of [[-12.5, 27], [-12.5, 30.5], [-12.5, 34.3], [-6, 34.3], [0, 34.3], [3.1, 34.3], [3.1, 31.7]]) b.cyl(x, -.3, z, .16, 1, 0x5a4630, 1, 6);
  b.box(-15.2, 0, 21.6, 2.2, 2.3, 2, 0xf2efe6); b.box(-15.2, 2.3, 21.6, 2.6, .2, 2.4, 0xb0302a); b.box(-15.2, .9, 22.62, 1.2, .8, .05, 0x3a4458); rect(-16.3, -14.1, 20.6, 22.6);
  rect(-58, -12.6, 25.5, 36); rect(-10, 58, 25.5, 31.55); rect(3.2, 58, 31.55, 36);                                                            // the river
  for (const sx of [-1, 1]) b.box(-7 + sx * 1.6, 0, 32.1, .1, 2.1, .1, WOOD);
  sign('ADVENTURES\nSIGN UP HERE', -7, 1.1, 32.14, 3.2, 1.3, { bg: '#f6efe0', fg: '#b0302a', border: '#b0302a' }); C.push({ x: -7, z: 32.1, r: .9 });
  const bz = 29.3, RED = 0xb0302a;                                                                                                          // the Steamboat Natchez
  b.box(-1, -.45, bz, 15.4, .9, 3.6, 0xffffff); b.box(-1, -.45, bz, 15.5, .2, 3.7, RED); b.box(-1.6, .45, bz, 11.6, 1, 3, 0xffffff); b.box(-1, 1.45, bz, 14, .08, 3.5, 0xd8d0c0);
  b.box(-2, 1.53, bz, 9.6, .95, 2.6, 0xffffff); b.box(-1.6, 2.48, bz, 12.4, .08, 3.3, 0xd8d0c0); b.box(-3, 2.56, bz, 5, .8, 2.1, 0xffffff); b.box(-3, 3.36, bz, 5.4, .08, 2.4, RED);
  b.box(-5.2, 3.44, bz, 1.5, .85, 1.5, 0xffffff); b.box(-5.2, 4.29, bz, 1.8, .14, 1.8, RED);
  for (const dz of [-.65, .65]) { b.cyl(-6.6, 2.56, bz + dz, .2, 3.3, 0x1c1a24, 1, 6); b.cyl(-6.6, 5.86, bz + dz, .3, .3, 0xffd27a, 1.3, 6, 1.1); }
  for (let k = 0; k <= 18; k++) { b.box(-7.6 + k * .74, 1.53, bz + 1.7, .05, .5, .05, 0xffffff); if (k < 16) b.box(-7.2 + k * .74, 2.56, bz + 1.6, .05, .45, .05, 0xffffff); }
  b.box(-1, 2, bz + 1.7, 13.4, .05, .05, 0xffffff); b.box(-1.6, 3, bz + 1.6, 11.2, .05, .05, 0xffffff);
  for (let k = 0; k < 8; k++) { b.box(-6.4 + k * 1.3, .7, bz + 1.52, .5, .6, .04, 0x3a4458); b.box(-5.6 + k * 1.1, 1.75, bz + 1.32, .4, .5, .04, 0x3a4458); }
  for (let k = 0; k < 4; k++) b.box(7.6, -.4, bz, .22, 3, 3.2, RED, 0, 0, 0, k * Math.PI / 4); b.box(6.9, .45, bz, .5, 1.3, 3.5, 0xffffff);
  sign('NATCHEZ', -1.2, 1.62, bz + 1.34, 3.2, .6, { bg: '#ffffff', fg: '#b0302a', border: '#b0302a' });
  b.box(-1, .1, bz + 2.1, 1.2, .08, 1.3, 0xd8d0c0, 0, 0, .2);
  b.box(13, 0, 22.2, 8, 3.6, 4.8, 0xb86a4a); b.box(13, 3.6, 22.2, 8.3, .25, 5.1, CREAM); b.box(10.5, 3.85, 22.2, 1.6, 1.4, 1.6, 0xb86a4a); for (let k = -3; k <= 3; k++) b.box(13 + k * 1.05, 1.5, 19.78, .6, 1.2, .05, 0x3a4458); rect(9, 17, 19.8, 24.6);
  const jx = sign('JAX BREWERY', 13.6, 4.1, 22.6, 5, .9, { bg: '#1c1a24', fg: '#ffd27a', border: '#ffd27a', glow: true }); jx.rotation.x = -1.05;
  b.box(26.5, 0, 21.6, 11, .45, 3.4, 0xc8c2b8); b.box(26.5, .45, 22, 9, .4, 2.4, 0xc8c2b8); b.cyl(26.5, .85, 22, .5, .1, 0x3a3540, 1, 8); b.box(26.5, 1.05, 22, .3, .3, 1.5, 0x1c1a24, 0, 0, .2); rect(21, 32, 19.9, 23.3);
  for (let k = 0; k < 12; k++) b.box(35.5 + k, 2.3, 21.2, 1, .14, 4.8, k % 2 ? 0xffffff : 0x1f7a45); for (const x of [35.2, 39, 43, 46.8]) for (const z of [19, 23.4]) b.box(x, 0, z, .12, 2.3, .12, 0x1f5a45);
  b.box(41, 0, 21.6, 11, 1, 3, 0xf2efe6); rect(35, 47, 19, 23.5);
  const cf = sign('CAFÉ DU MONDE', 41, 2.75, 21.4, 6.4, 1, { bg: '#1f5a45', fg: '#ffffff', glow: true }); cf.rotation.x = -1.05;
  for (const x of [42.2, 44.6]) { cafeTable(b, x, 18.3); C.push({ x, z: 18.3, r: .45 }); }
  sign('FRENCH MARKET →', 52, 2.3, 18.7, 4.6, .8, { bg: '#1f5a45', fg: '#ffe27a', border: '#ffe27a' }); for (const sx of [-1, 1]) b.box(52 + sx * 2.1, 0, 18.7, .1, 2.7, .1, IRON);

  /* Canal Street: neutral ground, palms, a red streetcar. The CBD and the Hilton Riverside beyond it. */
  b.box(-54, 0, -4, 2.2, .06, 60, 0x8a9a80); for (const dx of [-.45, .45]) b.box(-54 + dx, .06, -4, .06, .03, 60, 0x3a3540); for (const z of [-27, -20, 2, 9]) { palm(b, -54, z); C.push({ x: -54, z, r: .3 }); }
  b.box(-54, .3, -9, 1.6, 1.6, 4.8, 0xb0302a); b.box(-54, 1.9, -9, 1.7, .16, 5, 0xf2e6c8); b.box(-54, 1.1, -9, 1.64, .5, 4.2, 0x3a4458); b.box(-54, 2.06, -9, .05, .7, 1.6, IRON, 0, 0, .6); rect(-54.8, -53.2, -11.4, -6.6);
  for (let k = 0; k < 5; k++) b.box(-64.5, 0, -30 + k * 10, 12, 6 + ((k * 5) % 4) * 1.6, 9, [0xa8a4b0, 0xc8b8a0, 0x8a94a8][k % 3]);
  b.box(-64.5, 0, 22, 12, 13, 9, 0xd0c8b8); for (let k = 0; k < 7; k++) b.box(-64.5, 1.6 + k * 1.6, 26.52, 11, .6, .05, 0x3a4458);
  sign('HILTON', -64.5, 13.2, 26.56, 6, 1.4, { bg: '#1a2a5a', fg: '#ffffff', glow: true });
  for (let k = 0; k < 6; k++) b.box(62, 0, -30 + k * 9.5, 10, 3.2 + (k % 3), 8.6, CREOLE[(k * 2) % CREOLE.length]);

  /* things the street performers stand around */
  b.cone(8.1, 1.02, -16.45, .14, .32, 0xffd27a, 6); b.box(9.3, 1.05, -16.45, .6, .06, .06, 0xffd27a); b.cone(10.6, 1.5, -16.6, .34, .5, 0xffd27a, 8); b.cyl(11.8, .55, -16.4, .3, .28, 0xf2efe6, 1, 8); b.box(9.9, 0, -15.7, .5, .12, .4, 0x1c1a24);
  b.box(23.2, 0, -1.3, .7, .4, .7, 0x8a8a94); b.cyl(30.8, 0, -.5, .5, .72, 0x5a2a6a, 1, 8); b.box(30.75, .73, -.5, .2, .02, .28, 0xf2efe6, .3);
  b.box(16.6, 0, -30.9, .36, .3, .36, 0x9a9aa4); b.box(-21.3, 0, 24, .4, .12, .3, 0x1c1a24);
  b.box(27, 0, -32.1, 1.5, .8, .6, 0xe5484d); b.box(27, .8, -32.1, 1.7, .3, .5, 0xffd27a); b.cyl(26.2, 0, -32.1, .05, 2, IRON, 1, 5); b.cyl(26.2, 2, -32.1, .9, .22, 0xffd27a, .1, 8); for (const sx of [-.6, .6]) b.cyl(27 + sx, .05, -31.8, .2, .06, 0x2a2a33, 1, 8);
}

function buildPitch(b) {                                           // a windowless Hilton conference room
  const x = PX, z = PZ, WALLC = 0xe8dcc0;
  b.box(x, -.4, z, 160, .08, 160, 0x16141c); b.box(x, -.3, z, 10.4, .3, 7.4, 0x4a5a80); for (let k = -4; k <= 4; k++) b.box(x + k * 1.1, 0, z, .08, .01, 7.2, 0x5a6a94);
  b.box(x, 0, z - 3.6, 10.4, 3.3, .2, WALLC); b.box(x - 5.1, 0, z, .2, 3.3, 7.4, 0xd8ccb0); b.box(x + 5.1, 0, z, .2, 3.3, 7.4, 0xd8ccb0); b.box(x, 0, z - 3.48, 10.2, .9, .06, 0x8a6a4a);
  sign('OWN A PIECE\nOF PARADISE', x - 1.6, 2.05, z - 3.44, 3.8, 1.9, { bg: '#1a2a5a', fg: '#ffe27a', border: '#ffffff', glow: true });
  sign('HILTON', x + 3.4, 2.75, z - 3.44, 1.9, .5, { bg: '#ffffff', fg: '#1a2a5a', border: '#1a2a5a' });
  for (let k = 0; k < 4; k++) b.box(x + 2.6 + k * .5, 1.1, z - 3.44, .34, .3 + k * .32, .05, [0x4fae6a, 0x4fae6a, 0xffd27a, 0xe5484d][k], 0, 1.1);           // a chart that only goes up
  b.box(x, .72, z - .2, 4.6, .08, 1.5, 0x6a4226); for (const sx of [-1, 1]) b.box(x + sx * 1.9, 0, z - .2, .12, .72, 1.1, 0x4a3226);
  for (let k = 0; k < 5; k++) b.box(x - 1.6 + k * .8, .8, z - .3 + (k % 2) * .25, .3, .02, .42, [0x3d8bd9, 0xffd27a, 0xf2efe6, 0x3d8bd9, 0xff9ab8][k], k * .4);    // brochures
  for (const sx of [-.5, .7]) { b.cyl(x + sx, .8, z + .25, .05, .02, 0xffffff, 1, 6); b.cyl(x + sx, .82, z + .25, .012, .12, 0xffffff, 1, 5); b.cyl(x + sx, .94, z + .25, .012, .1, 0xffb347, 6, 6); }       // the free mimosas
  b.box(x + 1.5, .8, z + .1, .05, .02, .3, 0x1a2a5a, .6);                                                                                                // the pen
  for (const sx of [-.6, .6]) { b.box(x + sx, 0, z + 1.5, .55, .45, .55, 0x2a2a33); b.box(x + sx, .45, z + 1.76, .55, .6, .08, 0x2a2a33); }
  b.cyl(x - 4.3, 0, z - 2.8, .3, .5, 0xb86a4a, .8, 6); b.ball(x - 4.3, 1, z - 2.8, .55, 0x3f9a52); b.ball(x - 4.1, 1.5, z - 2.7, .36, 0x3f9a52);
  b.box(x + 4.3, 0, z - 2.2, .8, .8, 1.6, 0x8a6a4a); b.cyl(x + 4.3, .8, z - 2.5, .22, .5, 0xc8ccd4, 1, 8); b.box(x + 4.3, .8, z - 1.8, .5, .12, .4, 0xf2efe6);                // coffee urn, stale danish
  b.box(x + 5, 0, z + 2, .08, 2.3, 1.2, 0x4a3226);
}

function buildSwamp(b, c) {                                        // three bayous. Each is one lap long and built to repeat, so a boat that finishes a lap is slid back to the start unseen
  c.courses = COURSES.map((C, ci) => {
    const N = C.L / STEP, far = C.L + 144, mid = SWZ - C.L / 2 - 40, len = C.L + 260, dark = C.night ? .55 : 1, tint = (col) => { const r = (col >> 16) * dark, g = ((col >> 8) & 255) * dark, bl = (col & 255) * dark; return (r << 16) | (g << 8) | (bl | 0); };
    b.box(C.x, -.5, mid, 150, .4, len, C.water);
    for (const sx of [-1, 1]) { b.box(C.x + sx * 54, -.2, mid, 40, 3.6, len, tint(0x2f5a3a)); b.box(C.x + sx * 60, 3.4, mid, 32, 2.4, len, tint(0x2a4a34)); }
    for (let i = -6; i * STEP < far; i++) { const z = SWZ - i * STEP, j = ((i % N) + N) % N;
      for (const sx of [-1, 1]) { const r = hash(ci * 50 + j * 3 + sx), x = lane(C, z) + sx * (C.hw + 2.8 + r * 1.6);
        b.box(x, -.3, z, 5.4, .32, 6.6, tint(r > .5 ? 0x4a8a4a : 0x5a9a50), r * 3); b.box(x + sx * 1.2, -.3, z + 1.5, 4.2, .4, 4.4, tint(0x4f9050), r * 5 + 1);
        if ((j + (sx > 0)) % 2) { const tx = x + sx * (1 + r), H = 5 + r * 2.6;                                                                 // bald cypress, hung with Spanish moss
          b.box(tx, -.1, z, .7, H, .7, tint(0x6a5a4a), r * 3); b.box(tx, -.1, z, 1.3, .9, 1.3, tint(0x6a5a4a), r * 3 + .6); b.cone(tx, H - .5, z, 3.1, 1.3, tint(0x3a7a4a), 6); b.cone(tx, H + .3, z, 1.9, 1.1, tint(0x468a52), 6);
          for (const [dx, dz] of [[-1.5, .7], [1.2, 1.2]]) b.box(tx + dx, H - 2, z + dz, .14, 1.5 + r, .14, tint(0x8aa07a)); }
        else if (r > .4) for (let k = 0; k < 3; k++) b.box(x - sx * (3.2 + k * .5), -.1, z + k * .7, .5, .02, .5, tint(0x6aaa5a), k);                       // lily pads
        if (C.night && j % 2 === 0) { b.box(x - sx * 2.9, -.1, z, .1, 1.7, .1, WOOD); b.ball(x - sx * 2.9, 1.7, z, .2, 0xffd27a, 3); }
      } }
    for (const d of [0, C.L]) { const z = SWZ - d, x = lane(C, z);                                                                              // the start and finish line
      for (const sx of [-1, 1]) b.box(x + sx * C.hw, -.1, z, .28, 4.6, .28, WOOD); sign('START · FINISH', x, 4, z, C.hw * 2, 1.1, { bg: '#1c1a24', fg: '#ffe27a', border: '#ffe27a', glow: true });
      for (let k = 0; k < 12; k++) b.box(x - C.hw + .5 + k * (C.hw * 2 - 1) / 11, -.09, z, .5, .02, .5, k % 2 ? 0xffffff : 0x1c1a24); }
    const obs = [], rings = [], nOb = C.gators + C.logs;
    for (let k = 0; k < nOb; k++) { const d = 26 + (k + hash(ci * 9 + k) * .5) * (C.L - 56) / nOb, off = (hash(ci * 31 + k * 3.1 + 2) - .5) * 2 * (C.hw - 2.2), ry = hash(ci * 5 + k * 7.7) * 3.1, s = Math.sin(ry), co = Math.cos(ry), log = k % Math.max(2, Math.round(nOb / C.logs)) === 1;
      const x0 = lane(C, SWZ - d) + off; obs.push({ d, x: x0, log });
      for (const dd of [d, d + C.L]) { if (dd > far - 8) continue; const z = SWZ - dd, x = x0;
        if (log) { b.box(x, -.14, z, .42, .34, 2.6, 0x5a4630, ry); b.box(x + co * .2, .1, z - s * .2, .1, .3, .1, 0x5a4630, ry); }
        else { b.box(x, -.16, z, .56, .3, 1.7, 0x3a5a34, ry); b.box(x + s * 1.2, -.16, z + co * 1.2, .46, .24, .8, 0x4a6a3c, ry); b.box(x - s * 1.3, -.16, z - co * 1.3, .3, .2, 1, 0x3a5a34, ry);
          for (const e of [-1, 1]) b.dot(x + s * .95 + co * e * .16, .18, z + co * .95 - s * e * .16, C.night ? .09 : .06, 0xffe27a, 1.2); for (let j = -1; j <= 1; j++) b.box(x + s * j * .5, .12, z + co * j * .5, .16, .1, .16, 0x2f4a2c, ry); } } }
    for (let k = 0; k < C.rings; k++) { const d = 40 + k * (C.L - 70) / C.rings; rings.push({ d, x: lane(C, SWZ - d) + (hash(ci * 13 + k * 5.3) - .5) * (C.hw - 1.5) }); }
    return { ...C, obs, rings };
  });
}

function buildBoat(b, c) {                                         // the cruise: a red sternwheeler, deck plan seen from the river side
  const RED = 0xb0302a, x = BX, z = BZ;
  b.box(x, -1.9, z - 40, 500, .4, 320, 0x3a3a6a);
  b.box(x - .8, -1.5, z, 27, 1.5, 8.6, RED); b.box(x - .8, -.3, z, 27.2, .26, 8.8, 0xffffff); b.box(x, -.06, z, 24.6, .06, 8, 0xb08a5a); for (let k = -5; k <= 5; k++) b.box(x + k * 2.2, 0, z, .05, .01, 8, 0x9a7648);
  for (let k = 0; k <= 30; k++) b.box(x - 12 + k * .8, 0, z - 3.9, .06, .9, .06, 0xffffff); b.box(x, .9, z - 3.9, 24.2, .07, .09, 0xffffff); b.box(x, .45, z - 3.9, 24.2, .04, .04, 0xffffff);
  for (let k = 0; k <= 12; k++) b.box(x - 12 + k * 2, 0, z + 3.9, .06, .8, .06, 0xffffff); b.box(x, .8, z + 3.9, 24.2, .06, .08, 0xffffff);
  for (const sx of [-1, 1]) { b.box(x + sx * 12.1, .8, z, .08, .06, 7.8, 0xffffff); b.box(x + sx * 12, 0, z - 3.9, .1, 3.5, .1, 0xffffff); }
  for (let k = 0; k <= 26; k++) { const t = k / 26; b.ball(x - 12 + 24 * t, 3.5 - Math.sin(t * Math.PI) * .7, z - 3.9, .09, [0xffd27a, 0xff7ab6, 0x7ad7ff][k % 3], 3.2); }       // lights strung over the rail
  for (const dz of [-1.3, 1.3]) { b.cyl(x - 14.6, 0, z + dz, .3, 6, 0x1c1a24, 1, 6); b.cyl(x - 14.6, 6, z + dz, .44, .4, 0xffd27a, 1.3, 6, 1.1); }
  b.box(x - 13.4, 0, z, 2.2, 2.3, 2.6, 0xffffff); b.box(x - 13.4, 2.3, z, 2.6, .2, 3, RED); b.box(x - 12.28, 1, z, .05, .8, 1.6, 0x3a4458);                           // pilot house, forward
  b.box(x + 5, 0, z - .3, 3.8, .8, 1, 0xffffff); for (let k = 0; k < 5; k++) b.cyl(x + 3.6 + k * .7, .8, z - .3, .2, .1 + (k % 2) * .1, [0xd99a4a, 0x8a4a2a, 0xffd27a, 0xe5484d, 0xf2efe6][k], 1, 8);                  // the buffet
  b.cyl(x + 6.5, .8, z - .3, .06, .3, 0xffd27a, 1, 5); b.ball(x + 6.5, 1.2, z - .3, .1, 0xffe9b0, 3);
  b.box(x + 9.6, 0, z + 3, 1.8, .9, .6, 0x6a4226); for (let k = 0; k < 4; k++) b.cyl(x + 9 + k * .4, .9, z + 3, .06, .3, [0xe5484d, 0x4fae6a, 0xffd27a, 0x7ad7ff][k], .6, 5);                                 // the bar
  b.box(x - 1.6, 0, z - 3.3, 1.8, .42, .5, WOOD); b.box(x + 1.6, 0, z - 3.3, 1.8, .42, .5, WOOD);
  b.cyl(x - 9, 0, z - .6, .12, 1, WOOD, 1, 6); for (let k = 0; k < 4; k++) b.box(x - 9, .86, z - .5, .08, .9, .06, WOOD, 0, 0, 0, k * Math.PI / 4);                              // the wheel
  b.cone(x - 6, 1.02, z + 2.75, .14, .32, 0xffd27a, 6); b.cyl(x - 4, .55, z + 2.9, .3, .28, 0xf2efe6, 1, 8); b.box(x - 5, 0, z + 3.3, .5, 1.6, .3, 0x6a4226);
  c.rects.boat = [[x + 3.1, x + 6.9, z - .8, z + .2], [x + 8.7, x + 10.5, z + 2.7, z + 3.5], [x - 2.5, x + 2.5, z - 3.6, z - 3.05]];
  c.circs.boat = [{ x: x - 9, z: z - .6, r: .45 }];
  // the sternwheel turns, so it is its own little mesh
  const wb = new Batch(), wheel = new THREE.Group(); for (let k = 0; k < 4; k++) wb.box(0, -1.7, 0, .24, 3.4, 7.2, RED, 0, 0, 0, k * Math.PI / 4); wb.build(wheel); wheel.position.set(x + 14.6, .1, z); world.add(wheel);
  b.box(x + 13.2, -.3, z - 3.9, 3, .3, .3, 0xffffff); b.box(x + 13.2, -.3, z + 3.9, 3, .3, .3, 0xffffff);
  // the city, sliding past on the far bank
  const sb = new Batch(), sky2 = new THREE.Group(); sb.lo = true; sb.box(0, -.3, 4, 360, .9, 10, 0x2a2440);
  for (let k = 0; k < 46; k++) { const sx = -172 + k * 7.5, r = hash(k * 2.3 + 1), h = k > 30 ? 9 + r * 14 : 3.5 + r * 5; sb.box(sx, 0, 0, 6.4, h, 5, [0x2a2848, 0x34305a, 0x2a3454][k % 3]);
    for (let j = 0; j < 5; j++) sb.box(sx + (hash(k * 9 + j) - .5) * 5, 1 + hash(k * 5 + j * 3) * (h - 1.8), 2.56, .4, .4, .05, j % 2 ? 0xffd27a : 0xffe9b0, 0, 1.2);
    sb.dot(sx, .9, 8.6, .12, 0xffd9a0, 1.25); }
  for (const [dx, h, r] of [[0, 11, 1.4], [-2.6, 8, 1], [2.6, 8, 1]]) { sb.box(-20 + dx, 0, 3, r * 1.5, h * .55, 2, 0xd8d4e0); sb.cone(-20 + dx, h * .55, 3, r, h * .45, 0x4a4e6a, 6); }                      // the Cathedral, lit
  for (const tx of [70, 110]) { sb.box(tx, 0, -6, 1.4, 20, 1.4, 0x4a4868); sb.box(tx, 20, -6, 3, .6, 2, 0x4a4868); } sb.box(90, 9, -6, 110, .7, 1.6, 0x4a4868); for (let k = 0; k <= 22; k++) sb.dot(36 + k * 5, 9.9, -5, .14, 0xffe9b0, 1.25);   // the bridge
  sb.build(sky2); sky2.position.set(x + 46, -1.5, z - 78); world.add(sky2);
  c.wheel = wheel; c.skyline = sky2;
}

/* ───────── the mechanic ───────── */
function move(ch, dt, speed, bounds, rects, circs) {
  const ax = Input.axis.x, az = Input.axis.y, l = Math.hypot(ax, az);
  if (l > .05) { const p = ch.g.position, m = .34; p.x += ax * speed * dt; p.z += az * speed * dt; ch.face = Math.atan2(ax, az);
    for (const r of rects) if (p.x > r[0] - m && p.x < r[1] + m && p.z > r[2] - m && p.z < r[3] + m) {
      const dl = p.x - (r[0] - m), dr = r[1] + m - p.x, du = p.z - (r[2] - m), dd = r[3] + m - p.z, mn = Math.min(dl, dr, du, dd);
      if (mn === dl) p.x = r[0] - m; else if (mn === dr) p.x = r[1] + m; else if (mn === du) p.z = r[2] - m; else p.z = r[3] + m; }
    for (const c of circs) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), mm = c.r + m; if (d < mm && d > .001) { p.x = c.x + dx / d * mm; p.z = c.z + dz / d * mm; } }
    p.x = clamp(p.x, bounds[0], bounds[1]); p.z = clamp(p.z, bounds[2], bounds[3]); }
  ch.anim(dt, l * speed / 5); return l;
}
function trail(ch, tx, tz, dt, gap = 1.3, speed = 5) {
  const p = ch.g.position, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
  if (d > 14) { p.set(tx + .9, 0, tz + .5); return; }
  if (d > gap) { const s = Math.min(speed, (d - gap) * 4) * dt / d; p.x += dx * s; p.z += dz * s; ch.face = Math.atan2(dx, dz); ch.anim(dt, .8); } else ch.anim(dt, 0);
}

export function errands(ctx) {
  const me = ctx.me, pal = ctx.pal, door = HOTEL.door, exit = { x: RX + 3.9, z: RZ + 1.6 }, dockAt = [DOCK.x + 1.3, DOCK.z + .5];
  const shops = SHOPS.map((s) => ({ ...s, items: s.items.map(([n, cost, pts]) => ({ n, cost, pts, got: false })) }));
  const done = [false, false, false, false, false, false], once = new Set();
  let wallet = WALLET, zone = 'room', mode = null, say = null, busy = false, lock = 0, written = 0, opened = false, over = false, dash = 0, cd = 0, T = 0, noteNow = null, pitchI = 0, race = null, view = false, myType = 0, palType = 1, cup = 0;
  ctx.bounds = CITY;                                                                    // (tells main.js this is a big map, so the rain follows the camera)

  /* the pad: a checklist pinned to the corner of the screen */
  const pad = document.createElement('div');
  pad.style.cssText = 'position:absolute;left:6px;top:30px;z-index:5;padding:4px 7px 5px;background:#fff3a8;color:#2a2440;border-radius:2px;box-shadow:1px 2px 0 rgba(0,0,0,.45);font:700 9px/1.4 "Bradley Hand","Segoe Print","Comic Sans MS",cursive;transform:rotate(-1.5deg);transform-origin:top left;pointer-events:none;border-top:5px solid #e0b93a;text-shadow:none;letter-spacing:0;max-width:46%';
  $('#screen').appendChild(pad);
  const isDone = (l) => l.group ? l.group.every((i) => done[i]) : done[l.id];
  const draw = () => { pad.style.display = written ? 'block' : 'none';
    pad.innerHTML = '<div style="display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #c8a83a;margin-bottom:1px"><span>TO DO</span><span>$' + wallet + '</span></div>' +
      LIST.slice(0, written).map((l) => `<div style="${l.sub ? 'padding-left:9px;font-size:8px;' : ''}${isDone(l) ? 'text-decoration:line-through;opacity:.5' : ''}">${isDone(l) ? '☑' : '☐'} ${l.t}</div>`).join(''); };
  draw();

  const note = (t) => { if (t !== noteNow) { noteNow = t; UI.note(t); } };
  const closeMenu = () => { UI.panel(null); mode = null; lock = .3; };
  const speak = (lines, after) => { if (mode === 'menu' || mode === 'map') UI.panel(null); say = { lines, i: 0, after }; mode = 'say'; lock = .3; UI.say(lines[0][0], lines[0][1]); if (lines[0][2] != null) { written = lines[0][2]; draw(); } Sfx.move(); };
  const score = (n) => { const p = me.g.position; ctx.streak = 0; ctx.add(n, p.x, 1.6, p.z); };              // no combo multiplier on a day out
  const listDone = () => done[WEED] && done[FOOD] && done[GIFTS];
  const left = () => done.filter((d) => !d).length;
  const cheapest = (cat) => Math.min(...shops.filter((s) => s.cat === cat).flatMap((s) => s.items.filter((i) => !i.got).map((i) => i.cost)));
  // never let a purchase strand the list: keep back the cheapest way to finish everything else
  const reserve = (skip) => ADVENTURES.reduce((a, k) => a + (done[k.id] || k.id === skip ? 0 : k.$), 0) + Object.keys(CAT).reduce((a, c) => a + (done[CAT[c].obj] || CAT[c].obj === skip ? 0 : cheapest(c)), 0);
  const afford = (cost, obj) => cost <= wallet - reserve(obj);
  const mark = (i, mine) => { if (done[i]) return; done[i] = true; draw(); Sfx.big(); if (mine) ctx.send('pick', i);
    UI.pop('☑ ' + LIST.find((l) => l.id === i).t); me.cheer = pal.cheer = .6;
    if (!mine && i === HILTON && zone === 'pitch') toDock();                                              // two player: the other phone finished the scene we were both in
    if (!mine && i === GATOR && zone === 'swamp') toDock(); };
  const finish = (mine) => { if (over) return; over = true; rain.pts.visible = true; ctx.storm = true; if (mine) ctx.send('fin', 0); ctx.finish(); };
  ctx.on('pick', (i) => mark(i, false)); ctx.on('fin', () => finish(false));
  ctx.on('hit', (m) => {                                                                // two player: the other phone starting a scene, or news from its race
    if (Array.isArray(m)) { const [k, a, b2] = m;
      if (k === 'course') { palType = b2 || 0; if (!busy && !(zone === 'swamp' && race && race.k === a)) startCourse(a, false); }
      else if (k === 'lap' && race) race.palLap = a; else if (k === 'done' && race && race.k === a && !race.fin) { race.out++; race.palLap = race.C.laps; }
      return; }
    if (busy || zone === m) return; if (m === 'pitch') startPitch(false); else if (m === 'boat') startCruise(false); });
  ctx.onPhoto = () => { pad.remove(); view = false; };

  /* people */
  const npc = (look, x, z, face = 0, solid = 'city') => { const c = makeChar(look); c.g.position.set(x, 0, z); c.face = face; c.anim(0, 0); world.add(c.g); if (solid) ctx.circs[solid].push({ x, z, r: .4 }); return c; };
  const SK = [0xe6b596, 0xd59a70, 0xb9794f, 0xf0c8a4, 0x9a6a48], HR = [0x1a1412, 0x3a2a20, 0x6b3a24, 0xc8a050, 0x555060], TP = [0xe5484d, 0x3d8bd9, 0xf2efe6, 0xffd27a, 0x4fae6a, 0x8a5ad0, 0x2a2a33, 0xff9ab8];
  const anyone = (i, o = {}) => ({ skin: SK[i % 5], hair: HR[(i * 3) % 5], top: TP[(i * 5) % 8], legs: [0x2a2a33, 0x3b4a8a, 0x6a5240][i % 3], style: ['short', 'long', 'bun', 'curly'][i % 4], ...o });
  const spots = [];                                                                     // everything A does something at: { zone, x, z, r, label, act, c }
  for (const s of shops) { const [x, z] = s.at || [s.kx, s.kz]; s.c = npc({ ...anyone(x | 0), ...s.look }, x, z); spots.push({ zone: 'city', x, z, r: 1.9, label: s.name, act: () => openShop(s), c: s.c }); }
  const guy = npc({ ...anyone(2), ...DOCK.look }, DOCK.x, DOCK.z);
  spots.push({ zone: 'city', x: DOCK.x, z: DOCK.z, r: 2, label: DOCK.name, c: guy, act: () => speak([[DOCK.name, !done[HILTON] ? 'Adventure? I got three. First one is free: a trip to the Hilton. You just sit through a little presentation.'
    : !done[GATOR] ? 'You lived. Next line on the clipboard: the Airboat Alligator Race. Three courses. Bring your nerve.' : 'Back in one piece. The Natchez is boarding whenever you are. Last line on the clipboard.']], openDock) });
  const band = [0, 1, 2, 3].map((k) => npc(anyone(k + 4, { top: [0xf2efe6, 0x2a2a33][k % 2], cap: k % 2 ? 0x2a2a33 : undefined }), 7.5 + k * 1.25, -16.9));
  const dancers = [0, 1, 2].map((k) => npc(anyone(k + 9, { top: [0xb04ad9, 0xffd27a, 0x4fae6a][k] }), -12, -30, 0, false));
  const statue = npc({ skin: 0xc8c8d0, hair: 0xa8a8b4, top: 0xb8b8c4, legs: 0x9a9aa6, cap: 0xa8a8b4 }, 23.2, -1.3); statue.g.position.y = .4; statue.sh.visible = false;
  const tarot = npc(anyone(7, { top: 0x5a2a6a, style: 'long' }), 30.8, -1.2);
  const tapper = npc(anyone(11, { top: 0xffd27a, scale: .85 }), 16, -31.3), sax = npc(anyone(13, { top: 0x2a2a33, cap: 0x2a2a33 }), -22, 23.6);
  const actors = [band[1], dancers[0], statue, tarot, tapper, sax];
  for (const k of BUSKERS) spots.push({ zone: 'city', x: k.x, z: k.z, r: 2.1, label: k.name, c: null, act: () => tip(k) });
  for (let k = 0; k < 4; k++) { const c = npc(anyone(k + 15), -16 + k * 1.1, -33, 0, false); c.g.position.y = 2.52; c.sh.visible = false; }                  // a party on a Bourbon Street gallery
  const walkers = STROLL.map(([a, b2, speed], i) => ({ a, b: b2, speed, c: npc(anyone(i + 20), a[0], a[1], 0, false), k: ctx.rnd(), len: Math.hypot(b2[0] - a[0], b2[1] - a[1]) }));
  const rain = ambient({ n: 240, col: 0xaec6ff, size: .07, area: 13, h: 11, vy: -15, drift: 0, add: false, opacity: .55 }); rain.pts.visible = false; ctx.amb.push(rain);
  // the Hilton: the sales guy, and the manager who comes in when it is not going well
  const rep = npc({ ...anyone(1), top: 0x1a2a5a, tie: 0xe5484d, hair: 0xc8a050, legs: 0x2a2a33 }, PX - 1.2, PZ - 1.5, 0, false), mgr = npc({ ...anyone(3), top: 0x3a3a44, tie: 0xffd27a, hair: 0x555060, beard: 0x555060, legs: 0x2a2a33 }, PX + 1.5, PZ - 1.5, 0, false);
  // the boats: three kinds, built the first time each racer uses one
  const RACER = [0xe5484d, 0x3d8bd9, 0xffd27a, 0x4fae6a], pool = new Map();
  const getBoat = (slot, type) => { const key = slot * 3 + type; for (const [k, g] of pool) if ((k / 3 | 0) === slot) g.visible = false;
    let g = pool.get(key); if (g) { g.visible = true; return g; }
    g = new THREE.Group(); const b = new Batch(), col = RACER[slot]; b.lo = true;
    if (type === 0) {                                                                                               // airboat: flat hull, high seat, a big caged fan
      b.box(0, -.08, 0, 1.7, .3, 3.2, 0xc8ccd4); b.box(0, .02, -1.8, 1.5, .2, .6, 0xc8ccd4, 0, 0, -.5); b.box(0, .22, .2, .8, .5, .7, col); b.box(0, .22, 1.05, .6, .7, .5, 0x3a3540);
      for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; b.box(Math.cos(a) * .9, 1.45 + Math.sin(a) * .9 - .06, 1.5, .62, .12, .14, col, 0, 0, 0, a + 1.571); } b.box(0, .7, 1.45, .1, 1.5, .06, 0x1c1a24);
    } else if (type === 1) {                                                                                        // mud boat: a camo jon boat with a long-tail motor
      b.box(0, -.08, 0, 1.6, .36, 3.4, 0x5a6a3a); b.box(0, .28, 0, 1.3, .04, 3.1, 0x3f4a2a); b.box(0, .02, -1.9, 1.4, .26, .6, 0x5a6a3a, 0, 0, -.45); for (const z of [-.7, .5]) b.box(0, .28, z, 1.5, .14, .36, col);
      b.box(-.5, .3, -1.2, .4, .3, .5, 0x6a5240); b.box(0, .2, 1.75, .46, .7, .56, 0x2a2a33); b.box(0, .86, 1.75, .5, .12, .6, col); b.box(0, .05, 2.75, .1, .1, 1.8, 0x8a8a94, 0, 0, .28);
    } else {                                                                                                        // speedboat: pointed bow, windshield, twin engines
      b.box(0, -.08, .35, 1.5, .42, 2.6, 0xffffff); b.box(0, -.08, -.95, 1.06, .42, 1.06, 0xffffff, .785); b.box(0, .12, .35, 1.54, .1, 2.62, col); b.box(0, .12, -.95, 1.1, .1, 1.1, col, .785);
      b.box(0, .34, -.45, 1.2, .42, .08, 0x3a4458, 0, 0, -.45); b.box(0, .34, .5, 1.1, .2, .5, col); for (const sx of [-.4, .4]) { b.box(sx, .1, 1.75, .36, .6, .44, 0x1c1a24); b.box(sx, .7, 1.75, .38, .08, .46, col); }
    }
    b.build(g); world.add(g); pool.set(key, g); return g; };
  const locals = [npc(anyone(31, { cap: 0x2a4a2a }), 0, SWZ + 80, Math.PI, false), npc(anyone(34, { cap: 0xb0302a }), 0, SWZ + 80, Math.PI, false)];
  const ringIt = items(12, 'ring', 0x7ad7ff, 1.2);
  // the steamboat's crew and band
  const captain = npc({ ...anyone(4), top: 0xffffff, cap: 0xffffff, beard: 0xf2efe6, hair: 0xf2efe6, legs: 0x1a2a5a }, BX - 8.2, BZ + .3, 0, 'boat');
  const trio = [0, 1, 2].map((k) => npc(anyone(k + 40, { top: 0x2a2a33, cap: k === 1 ? 0x2a2a33 : undefined }), BX - 6 + k, BZ + 2.5, 0, 'boat'));
  npc({ ...anyone(44), top: 0xf2efe6, tie: 0x1c1a24 }, BX + 9.6, BZ + 2.2, 0, 'boat');
  spots.push({ zone: 'boat', x: BX + 5, z: BZ + .7, r: 1.7, label: 'the buffet', act: () => openBuffet() },
    { zone: 'boat', x: BX, z: BZ - 2.5, r: 1.5, label: 'look at the city', act: () => { view = true; if (!once.has('view')) { once.add('view'); score(4); } speak(VIEW.map((l) => ['', l]), () => { view = false; }); } },
    { zone: 'boat', x: BX - 8.2, z: BZ + .3, r: 1.8, label: 'the captain', c: captain, act: () => speak([['the captain', 'Stay aboard as long as you like. Say the word and I will bring her in.']], endCruise) });
  for (const [x, z, label, lines] of CRUISE_SPOTS) spots.push({ zone: 'boat', x: BX + x, z: BZ + z, r: 1.8, label, act: () => { if (!once.has(label)) { once.add(label); score(2); } speak(lines.map((l) => ['', l])); } });
  const buffet = BUFFET.map(([n, line]) => ({ n, line, got: false }));

  /* moving between the sets */
  const go = (z, x, zz, setup, after) => { busy = true; if (mode === 'menu' || mode === 'map') UI.panel(null); UI.say(); say = null; mode = null; Sfx.ok();
    fade(0, .35).then(() => { zone = z; for (const c of [me, pal]) { c.y = 0; c.body.rotation.z = 0; } me.g.position.set(x, 0, zz); pal.g.position.set(x + 1.1, 0, zz + .5); me.face = pal.face = 0; for (const g of pool.values()) g.visible = false; if (z !== 'boat') day();
      setup && setup(); api.cam(); Cam.snap(); return fade(1, .45); }).then(() => { busy = false; lock = .2; after && after(); }); };
  const toDock = () => go('city', dockAt[0], dockAt[1]);

  /* 1 · the Hilton pitch: pick whatever is funniest. Every answer scores, nothing can go wrong. */
  const startPitch = (mine) => { if (mine) ctx.send('hit', 'pitch'); pitchI = 0;
    go('pitch', PX - .6, PZ + 1.1, () => { pal.g.position.set(PX + .6, 0, PZ + 1.1); me.face = pal.face = Math.PI; mgr.g.visible = false; }, pitchStep); };
  const pitchStep = () => { if (zone !== 'pitch' || busy) return; const r = PITCH[pitchI];
    if (!r) return speak(PITCH_END, () => { score(OBJ_PTS); mark(HILTON, true); toDock(); });
    const who = r.manager ? 'the manager' : 'the sales guy', c = r.manager ? mgr : rep; mgr.g.visible = mgr.g.visible || !!r.manager; c.cheer = .7; mode = 'menu';
    UI.menu({ kicker: r.clock + ' into the “ninety minutes”', title: who, text: r.line, clear: true, items: r.replies.map(([mineLine, back]) => ({ label: mineLine, fn: () => { closeMenu(); score(2); me.cheer = .5; pitchI++; speak([[who, back]], pitchStep); } })) }); };

  /* 2 · the Airboat Alligator Race: a three-course cup. Pick a boat before each race. */
  const light = (a, b, c, fogCol, near, far, hemi, hemiCol, sunCol, sun) => { const u = ctx.sky.children[0].material.uniforms; u.a.value.set(a); u.b.value.set(b); u.c.value.set(c); scene.fog = new THREE.Fog(fogCol, near, far);
    ctx.hemi.intensity = hemi; ctx.hemi.color.set(hemiCol); ctx.sun.color.set(sunCol); ctx.sun.intensity = sun; };
  const day = () => light(0x4a5ac0, 0xf0b890, 0xd89a78, 0xe0b098, 46, 135, 2.5, 0xdcd0ff, 0xffe0b0, 2.3);
  const night = () => light(0x080820, 0x1a2a4a, 0x0a1a1a, 0x14203a, 26, 105, 1.5, 0x8aa0e0, 0xaac0ff, 1.1);
  const pickBoat = (k) => { const C = COURSES[k]; mode = 'menu';
    UI.menu({ kicker: `race ${k + 1} of ${COURSES.length} · ${C.laps} laps`, title: C.name, text: C.blurb + ' Pick your boat.', clear: true, items: BOATS.map((bt, i) => ({ label: bt.n, hint: bt.hint, fn: () => { closeMenu(); myType = i; startCourse(k, true); } })) }); };
  const startCourse = (k, mine) => { const C = ctx.courses[k], side = mine ? -1 : 1, z0 = SWZ + 6, x0 = lane(C, z0), w = C.hw / 6;
    if (mine) ctx.send('hit', ['course', k, myType]);
    go('swamp', x0 + side * 1.7, z0, () => { if (C.night) night();
      race = { k, C, t: -3.4, lap: 0, v: 0, boost: 1, bt: 0, hit: 0, fin: false, place: 1, out: 0, got: new Set(), palLap: 0, palRaw: null, boat: getBoat(0, myType), ai: [
        { c: pal, type: ctx.twoP ? palType : (myType + 1) % 3, d: -6, v: 0, v0: C.pace + .5, off: -side * 1.7, ph: 1, pal: true },
        { c: locals[0], type: k % 3, d: -6, v: 0, v0: C.pace, off: -3.6 * w, ph: 2.6 }, { c: locals[1], type: (k + 2) % 3, d: -6, v: 0, v0: C.pace - .6, off: 3.6 * w, ph: 4.4 }] };
      race.ai.forEach((a, i) => { a.g = getBoat(i + 1, a.type); });
      pal.g.position.set(x0 - side * 1.7, 0, z0); me.face = pal.face = Math.PI; raceTick(0, 0); }); };
  const raceOver = () => { const R = race; if (!R || R.fin) return; R.fin = true; Sfx.big(); const place = Math.min(4, R.out + 1), last = R.k === COURSES.length - 1;
    ctx.send('hit', ['done', R.k]); score(RACE_PTS[place - 1]); cup += RACE_PTS[place - 1]; if (place === 1) FX.confetti(me.g.position.x, 2.5, me.g.position.z - 3, 60);
    speak([[R.C.name, ORD[place - 1] + ' place!'], ['', RACE_END[place - 1]], ...(last ? [['the cup', `Three races, ${cup} points out of ${RACE_PTS[0] * COURSES.length}. ${cup >= 24 ? 'Swamp royalty.' : cup >= 15 ? 'Respectable. The gators nod.' : 'You finished all three. That counts.'}`]] : [])],
      () => { if (!last) pickBoat(R.k + 1); else { mark(GATOR, true); toDock(); } }); };
  const raceTick = (dt, t) => { const R = race, C = R.C, B = BOATS[myType], p = me.g.position, total = C.laps * C.L;
    R.t += dt; const n = Math.ceil(-R.t);
    if (R.t < 0) { if (n !== R.cnt && n <= 3) { R.cnt = n; UI.pop(String(n)); Sfx.beep(440, .12, 'square', .14); } }
    else if (dt) { if (R.cnt) { R.cnt = 0; UI.pop('GO'); Sfx.beep(880, .3, 'square', .16); }
      R.bt -= dt; R.hit -= dt;
      if (Input.just.has('A') && R.boost > 0 && R.bt <= 0) { R.boost--; R.bt = B.boost; Sfx.dash(); FX.burst(p.x, .5, p.z + 1.6, 0xffffff, 12, 4, 3, .5, 1); }
      const vmax = R.bt > 0 ? B.vmax + 9 : B.vmax * (Input.axis.y > .4 ? .55 : 1); R.v += (vmax - R.v) * Math.min(1, dt * (R.bt > 0 ? 5 : B.acc));
      p.z -= R.v * dt; p.x += Input.axis.x * B.steer * dt;
      const cl = lane(C, p.z), e = C.hw - .9; if (Math.abs(p.x - cl) > e) { p.x = cl + Math.sign(p.x - cl) * e; R.v *= 1 - Math.min(1, dt * 1.1); }                    // dragging along the bank
      if (p.z <= SWZ - C.L) { p.z += C.L; R.lap++; for (const v of [Cam.pos, Cam.look, Cam.tp, Cam.tl]) v.z += C.L;                                           // a lap: slide everything back to the start line
        if (R.lap < C.laps) { UI.pop(R.lap === C.laps - 1 ? 'FINAL LAP' : `LAP ${R.lap + 1} of ${C.laps}`); Sfx.big(); R.boost++; ctx.send('hit', ['lap', R.lap]); } }
      const dm = SWZ - p.z;
      if (R.hit <= 0 && R.bt <= 0) for (const o of C.obs) if (Math.abs(o.d - dm) < 1.5 && Math.abs(o.x - p.x) < 1.3) { R.hit = 1.2; R.v = Math.min(R.v, B.bump); UI.pop(o.log ? 'log!' : B.bump > 8 ? 'bonk' : 'chomp!'); Sfx.bad(); rumble(70, .35); FX.burst(p.x, .3, p.z, 0xaec6ff, 14, 4, 6, .6, 1); break; }
      C.rings.forEach((r, i) => { const key = R.lap * 10 + i; if (!R.got.has(key) && Math.abs(r.d - dm) < 1.6 && Math.abs(r.x - p.x) < 1.8) { R.got.add(key); R.boost++; Sfx.pick(); UI.pop('boost +1'); } });
      if (Math.random() < dt * 9) FX.burst(p.x + (Math.random() - .5), .1, p.z + 1.8, 0xffffff, 2, 1.6, 4, .4, 1);
    }
    const myD = R.lap * C.L + (SWZ - p.z); let ahead = 0;
    if (ctx.twoP) { if (R.palRaw != null) pal.g.position.z = R.palRaw; ctx.palNet(dt); R.palRaw = pal.g.position.z; }                                        // the other phone's boat, in its own lap
    for (const a of R.ai) { const net = a.pal && ctx.twoP; let x;
      if (net) { a.d = R.palLap * C.L + (SWZ - R.palRaw); x = pal.g.position.x; }
      else { if (R.t > 0 && dt) { if (a.d >= total && !a.done) { a.done = true; R.out++; }
          const want = a.done ? 7 : a.v0 + Math.sin(t * .7 + a.ph) * 1.3 + clamp((myD - a.d) * .1, -2.2, 2.6); a.v += (want - a.v) * Math.min(1, dt * 1.5); a.d += a.v * dt; }                   // a little rubber band keeps it a race
        x = lane(C, SWZ - a.d) + a.off * .8 + Math.sin(a.d * .05 + a.ph) * 1.2; }
      const zd = SWZ - (a.d - R.lap * C.L);
      a.c.g.position.set(x, 0, zd); a.c.y = BOATS[a.type].seat; a.c.face = Math.PI; if (!net) a.c.anim(dt, 0);
      a.g.position.set(x, 0, zd); a.g.rotation.y = net ? 0 : Math.sin(a.d * .05 + a.ph) * .15; if (a.d > myD) ahead++; }
    R.place = ahead + 1;
    R.boat.position.set(p.x, 0, p.z); R.boat.rotation.y = -Input.axis.x * .22; R.boat.rotation.z = -Input.axis.x * .08; me.y = B.seat; me.face = Math.PI; me.anim(dt, 0);
    C.rings.forEach((r, i) => { for (const m of [0, 1]) { const on = !R.got.has((R.lap + m) * 10 + i) && R.lap + m < C.laps; ringIt.set(i * 2 + m, r.x, on ? .9 + Math.sin(t * 3 + i) * .15 : -9, SWZ - r.d - m * C.L, on ? 2.4 : 0, t * 2); } }); ringIt.flush();
    note(R.t < 0 ? 'STICK steer · pull back to slow · A boost' : `LAP ${Math.min(R.lap + 1, C.laps)}/${C.laps}   ${ORD[R.place - 1]} of 4   A · boost ×${R.boost}`);
    if (R.lap >= C.laps) raceOver(); };

  /* 3 · the steamboat: the ending. No goal, no clock. */
  const dusk = () => light(0x1c1a50, 0xe07a80, 0x5a3a78, 0x8a5a8a, 60, 260, 1.9, 0xb8a8e8, 0xff9a6a, 1.7);
  const startCruise = (mine) => { if (mine) { ctx.send('hit', 'boat'); wallet -= ADVENTURES[2].$; draw(); }
    go('boat', BX - 2, BZ + 1.2, dusk, () => speak(CRUISE_OPEN)); };
  const openBuffet = () => { mode = 'menu';
    UI.menu({ kicker: 'the buffet · included', title: 'Help yourself', clear: true, back: closeMenu, items: [
      ...buffet.map((d) => ({ label: d.n, hint: d.got ? 'eaten' : '+2', off: d.got, fn: () => { d.got = true; closeMenu(); score(2); speak([['', d.line]], () => { if (buffet.some((x) => !x.got)) openBuffet(); }); } })), { label: 'LEAVE', fn: closeMenu }] }); };
  const endCruise = () => { mode = 'menu';
    UI.menu({ kicker: 'steamboat natchez', title: 'Call it a night?', text: listDone() ? 'This ends the level. There is no rush.' : 'This ends the level, with things still on the list. No rush.', clear: true, back: closeMenu, items: [
      { label: 'STAY A WHILE', fn: closeMenu }, { label: 'BRING HER IN', fn: () => { closeMenu(); rain.pts.visible = true; ctx.storm = true; speak(CRUISE_END, () => { score(OBJ_PTS); mark(BOAT, true); finish(true); }); } }] }); };

  /* buying and booking */
  const tip = (k) => { const first = !once.has(k.id) && wallet - reserve() >= 1; if (first) { once.add(k.id); wallet--; draw(); score(TIP_PTS); actors[k.id].cheer = 1.2; }
    speak([[k.name, k.line], ...(first ? [['', 'You drop a dollar in the case.']] : [])]); };
  const openShop = (s) => { mode = 'menu'; const c = CAT[s.cat];
    UI.menu({ kicker: `${c.label} · you have $${wallet}`, title: s.name, text: `${s.keeper}: “${s.hi}”`, clear: true, back: closeMenu, items: [
      ...s.items.map((it) => ({ label: it.n, hint: it.got ? 'in the bag' : `$${it.cost} · +${it.pts}`, off: it.got, fn: () => {
        if (!afford(it.cost, c.obj)) { Sfx.back(); UI.toast(wallet < it.cost ? 'not enough cash' : 'save enough for the rest of the list'); return; }
        wallet -= it.cost; it.got = true; score(it.pts); s.c.cheer = .6; mark(c.obj, true); draw(); openShop(s); } })),
      { label: 'LEAVE', fn: closeMenu }] }); };
  const openDock = () => { mode = 'menu'; const [h, g, s] = ADVENTURES, price = (k) => k.$ ? '$' + k.$ : 'free';
    const book = (k, start) => () => { if (!afford(k.$, k.id)) { Sfx.back(); UI.toast('not enough cash'); return; } closeMenu(); start(true); };
    UI.menu({ kicker: `find adventure · you have $${wallet}`, title: 'The clipboard', text: 'Three lines, top to bottom.', clear: true, back: closeMenu, items: [
      { label: h.n, hint: done[HILTON] ? 'survived' : price(h), off: done[HILTON], fn: book(h, startPitch) },
      { label: g.n, hint: done[GATOR] ? 'raced' : !done[HILTON] ? 'after the Hilton' : price(g), off: done[GATOR] || !done[HILTON], fn: () => { if (!afford(g.$, g.id)) { Sfx.back(); UI.toast('not enough cash'); return; } closeMenu(); wallet -= g.$; draw(); pickBoat(0); } },
      { label: s.n, hint: !done[GATOR] ? 'after the race' : price(s), off: !done[GATOR], fn: book(s, startCruise) },
      { label: 'LEAVE', fn: closeMenu }] }); };
  const openMap = () => { mode = 'map'; Sfx.move(); const p = me.g.position, X0 = -60, Z0 = -37, Wm = 119, Hm = 73; let h = '';
    const r = (x0, x1, z0, z1, f, o = '') => `<rect x="${x0}" y="${z0}" width="${x1 - x0}" height="${z1 - z0}" fill="${f}" ${o}/>`;
    const t = (x, z, s, f, tx, o = '') => `<text x="${x}" y="${z}" font-size="${s}" fill="${f}" text-anchor="middle" ${o}>${tx}</text>`;
    h += r(X0, X0 + Wm, Z0, Z0 + Hm, '#3a3846') + r(X0, X0 + Wm, 25.6, Z0 + Hm, '#7a6a4a') + r(X0, 57, -37, -33.6, '#6a6478') + r(-60, -58, -37, 25.6, '#6a6478') + r(-58, 57, 17.5, 25.6, '#8a7a6a');
    for (const [k, [z0, z1]] of Object.entries(ROWS)) for (let c = 0; c < 6; c++) { const [x0, x1] = colX(c); h += r(x0, x1, z0, z1, c === 4 && k === 'C' ? '#4f9a5a' : c === 4 && k === 'B' ? '#c8c4bc' : '#6a6478'); }
    h += r(-12.6, -10, 25.6, 34.4, '#9a7248') + r(-12.6, 3.2, 31.6, 34.4, '#9a7248') + r(-8.7, 6.7, 27.5, 31.1, '#ffffff') + t(-1, 30.1, 2.2, '#b0302a', 'NATCHEZ') + t(27, 8.4, 2, '#fff', 'JACKSON SQ.') + t(27, -6.6, 2, '#2a2440', 'CATHEDRAL') + t(34, 31, 2.6, '#e8e2d0', 'MISSISSIPPI RIVER');
    for (const [n, z] of EW) h += t(-27, z + .9, 2.4, '#e8e2d0', n) + t(45, z + .9, 2.4, '#e8e2d0', n);
    for (const [n, x] of NS) h += t(x, -21.6, 2.4, '#e8e2d0', n, `transform="rotate(-90 ${x} -22.5)"`);
    const dot = (x, z, col, n, on = true) => `<circle cx="${x}" cy="${z}" r="2" fill="${col}" stroke="#14143a" stroke-width=".5" opacity="${on ? 1 : .35}"/>` + t(x, z + .8, 2.3, '#14143a', n, 'font-weight="700"');
    shops.forEach((s, i) => { const [x, z] = s.at || [s.kx, s.kz]; h += dot(x, z - 1, CAT[s.cat].css, i + 1, !done[CAT[s.cat].obj]); });
    h += dot(DOCK.x, DOCK.z, '#ffe27a', '★') + dot(door.x, door.z - 2, '#ffffff', 'H');
    if (zone === 'city') h += `<circle cx="${p.x}" cy="${p.z}" r="1.5" fill="#ff3a50" stroke="#fff" stroke-width=".6"><animate attributeName="r" values="1.2;2.2;1.2" dur="1s" repeatCount="indefinite"/></circle>`;
    const leg = (cat) => `<b style="color:${CAT[cat].css}">${CAT[cat].label}</b> ` + shops.map((s, i) => s.cat === cat ? `${i + 1} ${s.name.toLowerCase()}` : '').filter(Boolean).join(' · ');
    UI.panel(`<div class="kicker">french quarter · ${zone === 'city' ? 'red dot is you' : 'you are in the hotel (H)'}</div>
      <svg viewBox="${X0} ${Z0} ${Wm} ${Hm}" style="width:100%;border:1px solid #fff;border-radius:4px;font-family:Courier New,monospace">${h}</svg>
      <p style="font-size:8px;line-height:1.35;max-width:none;text-align:left">${leg('weed')}<br>${leg('food')}<br>${leg('gift')}<br><b style="color:#ffe27a">★ adventure</b> the man in the life vest, on the float behind the steamboat</p>
      <div class="hint">A or B · close</div>`); };

  const walls = { room: ROOM, city: CITY, boat: DECK };
  const api = {
    cam() { const p = me.g.position;
      if (zone === 'room') { const x = RX + (p.x - RX) * .4; Cam.set(x, 7.4, RZ + 9.6, x, .9, RZ - .3); }
      else if (zone === 'pitch') Cam.set(PX, 5.4, PZ + 8, PX, 1.2, PZ - .8);
      else if (zone === 'swamp') Cam.set(p.x, 5.6, p.z + 9.5, p.x, 1.4, p.z - 7);
      else if (zone === 'boat') { const x = BX + (p.x - BX) * .7; if (view) { Cam.set(BX, 3.4, BZ + 4.2, BX, 2.6, BZ - 60); me.face = pal.face = Math.PI; if (!ctx.twoP) pal.g.position.set(p.x + 1, 0, p.z); } else Cam.set(x, 7, BZ + 12, x, 1.6, BZ - 3); }   // view: over their shoulders, at the skyline
      else { const k = clamp(1 - (Math.abs(p.x - 27) - 7) / 4, 0, 1) * clamp((p.z + 5) / 3, 0, 1) * clamp((15 - p.z) / 3, 0, 1);                     // around Jackson Square the camera leans back to get the Cathedral spires in
        Cam.set(p.x, 11.5 + 2 * k, p.z + 7 + 4.5 * k, p.x, .6 + 2.4 * k, p.z - 1.5 - 2 * k); }
      ctx.sky.position.set(Cam.tp.x, 0, Cam.tp.z); },                                                                                              // the sets are far apart, so the sky travels with the camera
    dispose() { pad.remove(); },
    update(dt, t) {
      const p = me.g.position; T += dt; lock -= dt;
      if (!opened) { opened = true; speak(OPENING); }
      const A = Input.just.has('A'), Bk = Input.just.has('B'), roam = zone === 'room' || zone === 'city' || zone === 'boat';
      const near = roam && !busy ? spots.reduce((best, s) => { if (s.zone !== zone) return best; const d = Math.hypot(s.x - p.x, s.z - p.z); return d < s.r && (!best || d < best.d) ? { s, d } : best; }, null) : null;
      if (mode === 'say') { me.anim(dt, 0); if ((A || Bk) && lock <= 0) { if (++say.i < say.lines.length) { const l = say.lines[say.i]; UI.say(l[0], l[1]); if (l[2] != null) { written = l[2]; draw(); } Sfx.move(); } else { const after = say.after; say = null; mode = null; lock = .25; UI.say(); after && after(); } } }
      else if (mode === 'map') { me.anim(dt, 0); if ((A || Bk) && lock <= 0) closeMenu(); }
      else if (mode === 'menu' || busy || !roam) { if (zone === 'swamp' && !busy && race && !race.fin) raceTick(dt, t); else if (zone !== 'swamp') me.anim(dt, 0); }
      else {
        cd -= dt; dash -= dt;
        if (Bk && lock <= 0) { if (zone === 'boat') endCruise(); else openMap(); }
        else if (A && lock <= 0) {
          if (near) { if (near.s.c) near.s.c.face = Math.atan2(p.x - near.s.x, p.z - near.s.z); near.s.act(); }
          else if (cd <= 0) { dash = .22; cd = .7; Sfx.dash(); FX.burst(p.x, .3, p.z, 0xffffff, 5, 2, 2, .4, 1); }
        }
        if (mode == null && !busy) move(me, dt, dash > 0 ? 12 : 5.6, walls[zone], ctx.rects[zone], ctx.circs[zone]);
        if (zone === 'room' && !busy && Math.hypot(exit.x - p.x, exit.z - p.z) < .9) go('city', door.x, door.z + .3, null, () => UI.pop('Chartres Street'));
      }
      if (ctx.twoP) { if (zone !== 'swamp') ctx.palNet(dt); } else if (zone === 'pitch') pal.anim(dt, 0); else if (zone !== 'swamp') trail(pal, p.x, p.z, dt);
      if (zone === 'city') {
        for (let k = 0; k < band.length; k++) { band[k].anim(dt, .35); band[k].y = Math.abs(Math.sin(t * 5.2 + k)) * .06; }
        for (let k = 0; k < dancers.length; k++) { const a = t * 1.6 + k * 2.094, d = dancers[k]; d.g.position.set(-12 + Math.cos(a) * 1.1, 0, -30 + Math.sin(a) * .8); d.face = -a; d.y = Math.abs(Math.sin(t * 6 + k)) * .22; if (Math.sin(t * 1.3 + k * 2) > .93) d.cheer = .3; d.anim(dt, .8); }
        tapper.y = Math.abs(Math.sin(t * 11)) * .1; tapper.face = Math.sin(t * 2) * 1.3; tapper.anim(dt, 1); sax.anim(dt, 0); sax.body.rotation.z = Math.sin(t * 1.4) * .08; tarot.anim(dt, 0); statue.anim(statue.cheer > 0 ? dt : 0, 0); guy.anim(dt, 0);
        for (const s of shops) s.c.anim(dt, 0);
        for (const w of walkers) { const u = (T * w.speed / w.len + w.k * 2) % 2, f = u < 1 ? u : 2 - u, sg = u < 1 ? 1 : -1;
          w.c.g.position.set(w.a[0] + (w.b[0] - w.a[0]) * f, 0, w.a[1] + (w.b[1] - w.a[1]) * f); w.c.face = Math.atan2((w.b[0] - w.a[0]) * sg, (w.b[1] - w.a[1]) * sg); w.c.anim(dt, .7); }
      } else if (zone === 'pitch') { rep.anim(dt, 0); mgr.anim(dt, 0); rep.face = Math.sin(t * .8) * .5; }
      else if (zone === 'boat') { ctx.wheel.rotation.z -= dt * 1.4; ctx.skyline.position.x -= dt * .55; captain.anim(dt, 0); for (let k = 0; k < 3; k++) { trio[k].anim(dt, .35); trio[k].y = Math.abs(Math.sin(t * 4.4 + k)) * .05; }
        if (Math.random() < dt * 5) FX.burst(BX + 14.6, -.6, BZ + (Math.random() - .5) * 6, 0xffffff, 2, 1.5, 4, .5, 1); }
      if (mode == null && zone !== 'swamp') note(busy ? '' : zone === 'room' ? (written >= LIST.length ? 'the door is on the right →' : '') : near ? `A · ${near.s.label.toLowerCase()}` : zone === 'boat' ? 'B · call it a night' : zone === 'pitch' ? ''
        : done[GATOR] ? `B · map   the Natchez is boarding   ${left() - 1} left on the list` : `B · map   ${left()} left on the list`); else if (mode != null) note('');
      this.cam();
    },
  };
  return api;
}

/* ───────── the level ───────── */
export const NOLA = {
  id: 'nola', shot: [BX, BZ - 2.3], prop: 'beignet', caption: 'powdered sugar in a thunderstorm', kicker: 'April 2025 · French Quarter', title: 'New Orleans', sub: 'a list, a timeshare, gators, a steamboat.',
  game: 'errands', icon: '⚜', stars: [40, 70, 100],
  how: 'A hotel room in the Quarter. The wedding is tomorrow; today is yours. Write the list, then go cross it off.\nWeed, food and gifts come from any of several shops. The man in the life vest at the dock has the adventures: the Hilton, the airboat race, then the steamboat.\nSTICK walk · A talk and buy · B map',
  P: { col: 0xffd27a },
  build(b, c) {
    b.lo = true;
    c.sky = sky(0x4a5ac0, 0xf0b890, 0xd89a78); scene.fog = new THREE.Fog(0xe0b098, 46, 135);
    c.hemi = new THREE.HemisphereLight(0xdcd0ff, 0x8a7a70, 2.5); c.sun = new THREE.DirectionalLight(0xffe0b0, 2.3); c.sun.position.set(-8, 18, 16); world.add(c.hemi, c.sun);     // kept, so the steamboat can turn the day to dusk
    c.rects = {}; c.circs = {}; c.spawn = { x: RX + 1.15, z: RZ + 1.55 };
    buildRoom(b, c); buildCity(b, c); buildPitch(b); buildSwamp(b, c); buildBoat(b, c);
  },
};
