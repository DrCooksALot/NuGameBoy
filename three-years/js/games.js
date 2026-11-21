// The four mechanics every memory is built from. Each returns { cam(), update(dt,t), dispose?() }.
// All randomness comes from ctx.rnd (seeded) so two phones build identical levels.
import { THREE, world, Input, Cam, UI, Sfx, Music, rumble, clamp, lerp } from './engine.js';
import { SONGS } from './songs.js';
import { items, FX, makeChar, Batch } from './kit.js';

/* shared: stick-relative free movement with circle colliders */
function walk(ctx, ch, dt, speed) {
  const ax = Input.axis.x, az = Input.axis.y, l = Math.hypot(ax, az);
  if (l > .05) {
    const p = ch.g.position; p.x += ax * speed * dt; p.z += az * speed * dt; ch.face = Math.atan2(ax, az);
    if (ctx.bounds) { const B = ctx.bounds; p.x = clamp(p.x, B[0], B[1]); p.z = clamp(p.z, B[2], B[3]); }                    // a walled map
    else { const d = Math.hypot(p.x, p.z), R = ctx.R - .5; if (d > R) { p.x *= R / d; p.z *= R / d; } }                  // a round arena
    for (const c of ctx.colliders) { const dx = p.x - c.x, dz = p.z - c.z, dd = Math.hypot(dx, dz), m = c.r + .35; if (dd < m && dd > .001) { p.x = c.x + dx / dd * m; p.z = c.z + dz / dd * m; } }
  }
  ch.anim(dt, l * speed / 5);
  return l;
}
/* solo companion: trails the player like a good boyfriend */
function follow(ch, tx, tz, dt, gap = 1.3, speed = 4.6) {
  const p = ch.g.position, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
  if (d > gap) { const s = Math.min(speed, (d - gap) * 4) * dt / d; p.x += dx * s; p.z += dz * s; ch.face = Math.atan2(dx, dz); ch.anim(dt, .8); } else ch.anim(dt, 0);
}

/* ============ COLLECT: roam a diorama, grab everything, dodge hazards ============ */
export function collect(ctx) {
  const P = ctx.P, n = P.count, me = ctx.me, pal = ctx.pal, R = ctx.R;
  const spots = [];
  const place = () => { spots.length = 0; let guard = 0;
    while (spots.length < n && guard++ < 4000) {
      const a = ctx.rnd() * 6.283, r = 1.5 + Math.sqrt(ctx.rnd()) * (R - 2.6), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (wave === 1 && Math.hypot(x - ctx.spawn.x, z - ctx.spawn.z) < 2.5) continue;
      if (ctx.colliders.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + .7)) continue;
      if (spots.some((s) => Math.hypot(x - s.x, z - s.z) < 1.6)) continue;
      spots.push({ x, z, on: true });
    } };
  let wave = 1; place(); ctx.spots = spots;
  const it = items(spots.length, P.shape || 'coin', P.col || 0xffd77e);
  const haz = [];
  for (let i = 0; i < (P.hazards || 0); i++) { const h = P.hazard(i); world.add(h); haz.push({ o: h, r: 2.5 + ctx.rnd() * (R - 4), a: ctx.rnd() * 6.283, w: (ctx.rnd() < .5 ? -1 : 1) * (.35 + ctx.rnd() * .35) * (P.hazSpeed || 1) }); }
  const npcs = (P.npcs || []).map((nn) => { const c = makeChar(nn.look); c.g.position.set(nn.x, 0, nn.z); c.face = nn.face || 0; world.add(c.g); ctx.colliders.push({ x: nn.x, z: nn.z, r: .45 }); return { ...nn, c, i: 0 }; });
  let T = P.time || 0, left = spots.length, dash = 0, cd = 0, stun = 0, talking = null, goal = null, beacon = null;
  const pick = (i, mine) => { const s = spots[i]; if (!s || !s.on) return; s.on = false; left--;
    if (mine) { ctx.add(1, s.x, .8, s.z); ctx.send('pick', i); me.cheer = .35; } else { FX.burst(s.x, .8, s.z, P.col || 0xffd77e, 8); Sfx.pick(); }
    if (!left) { if (P.waves) { wave++; place(); left = spots.length; for (const h of haz) h.w *= 1.22; UI.pop('ROUND ' + wave); Sfx.big(); ctx.add(wave * 2); } else if (P.goal) { goal = P.goal; UI.note(P.goalNote || ''); Sfx.big(); beacon = items(1, 'ring', 0xffd77e, 1.2); } else ctx.finish(); } };
  ctx.on('pick', (i) => pick(i, false)); ctx.on('fin', () => ctx.finish());
  UI.note(P.note || '');
  return {
    cam() { const p = me.g.position; Cam.set(p.x * .75, 8.6, p.z * .75 + 9.2, p.x * .75, .6, p.z * .75); },
    update(dt, t) {
      const p = me.g.position;
      if (talking) { me.anim(dt, 0); if (Input.just.has('A') || Input.just.has('B')) { talking = null; UI.say(); } }
      else if (stun > 0) { stun -= dt; me.body.rotation.z = Math.sin(t * 40) * .2; me.anim(dt, 0); if (stun <= 0) me.body.rotation.z = 0; }
      else {
        cd -= dt; dash -= dt;
        if (Input.just.has('A')) {
          const near = npcs.find((q) => Math.hypot(q.x - p.x, q.z - p.z) < 1.7);
          const g = goal && Math.hypot(goal.x - p.x, goal.z - p.z) < 1.9;
          if (g) { ctx.send('fin', 0); ctx.finish(); return; }
          if (near) { talking = near; UI.say(near.name, near.lines[near.i++ % near.lines.length]); Sfx.move(); near.c.face = Math.atan2(p.x - near.x, p.z - near.z); }
          else if (cd <= 0) { dash = .22; cd = .7; Sfx.dash(); FX.burst(p.x, .3, p.z, 0xffffff, 5, 2, 2, .4, 1); }
        }
        walk(ctx, me, dt, dash > 0 ? 12 : 5.2);
      }
      if (ctx.twoP) ctx.palNet(dt); else follow(pal, p.x, p.z, dt);
      for (const q of npcs) q.c.anim(dt, 0);
      for (let i = 0; i < spots.length; i++) { const s = spots[i];
        if (s.on && Math.hypot(s.x - p.x, s.z - p.z) < .95) pick(i, true);
        it.set(i, s.x, .8 + Math.sin(t * 3 + i) * .15, s.z, s.on ? (P.itemScale || 1.4) : 0, t * 2 + i); }
      it.flush();
      for (const h of haz) { h.a += h.w * dt; const x = Math.cos(h.a) * h.r, z = Math.sin(h.a) * h.r; h.o.position.set(x, 0, z); h.o.rotation.y = -h.a + (h.w > 0 ? Math.PI : 0); h.o.position.y = Math.sin(t * 3 + h.r) * .15;
        if (stun <= 0 && dash <= 0 && Math.hypot(x - p.x, z - p.z) < (P.hazR || .9)) { stun = .7; ctx.add(-1); rumble(80, .4); Sfx.bad(); UI.pop(P.hazPop || 'oof'); } }
      if (beacon) { beacon.set(0, goal.x, 2.4 + Math.sin(t * 3) * .2, goal.z, 1.6, t * 2); beacon.flush(); }
      if (P.time) { T -= dt; UI.time(T); if (T <= 0) ctx.finish(); }
      this.cam();
    },
  };
}

/* ============ EXPLORE: a real place to walk around ============
   Take photos together at the sights (the score), dodge other visitors and squirrels, warm up at the drinks cart,
   find the lost glove, and get a couple to take THE picture: ask until one says yes, then lead them to the photo spot. */
export function explore(ctx) {
  const P = ctx.P, me = ctx.me, pal = ctx.pal, B = ctx.bounds = P.bounds;
  const shots = P.photos.map((s) => ({ ...s, done: false })), marks = items(shots.length, 'frame');
  ctx.spots = shots;
  const haz = (P.hazAt || []).map(([x, z, r], i) => { const o = P.hazard(i); world.add(o); return { o, cx: x, cz: z, r, a: ctx.rnd() * 6.283, w: (i % 2 ? -1 : 1) * (.5 + ctx.rnd() * .3) }; });
  // other visitors, strolling up and down the paths
  const walkers = (P.walkers || []).map((w, i) => { const c = makeChar(w.look); world.add(c.g); return { ...w, c, k: ctx.rnd(), len: Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) }; });
  const couples = P.couples.map((c, i) => { const a = makeChar(c.looks[0]), b = makeChar(c.looks[1]); a.g.position.set(c.x - .42, 0, c.z); b.g.position.set(c.x + .42, 0, c.z); a.face = b.face = c.face || 0; world.add(a.g, b.g);
    const col = { x: c.x, z: c.z, r: .8 }; ctx.colliders.push(col); return { ...c, i, a, b, col, asked: 0 }; });
  const yes = P.yesFrom[Math.floor(ctx.rnd() * P.yesFrom.length)];      // seeded, so both phones agree on who says yes
  ctx.yes = yes;
  const gl = P.gloveAt ? P.gloveAt[Math.floor(ctx.rnd() * P.gloveAt.length)] : null, glove = gl ? items(1, 'glove') : null; let gloveOn = !!gl;
  let stage = 0, chosen = null, leader = me, say = null, dash = 0, cd = 0, stun = 0, beacon = null, done = false, taken = 0, toddies = 0, warm = 0, T = 0, noteNow = '', opened = false;
  const note = (t) => { if (t !== noteNow) { noteNow = t; UI.note(t); } };
  const speak = (lines, after) => { say = { lines, i: 0, after }; UI.say(lines[0][0], lines[0][1]); Sfx.move(); };
  const accept = (ci, mine) => { if (stage) return; stage = 1; chosen = couples[ci]; leader = mine ? me : pal; ctx.colliders.splice(ctx.colliders.indexOf(chosen.col), 1);
    Sfx.big(); UI.pop('they said yes!'); beacon = items(1, 'ring', 0xffd77e, 1.2); if (mine) ctx.send('yes', ci); };
  const finish = (mine) => { if (done) return; done = true; if (mine) ctx.send('fin', 0); ctx.finish(); };
  const snap = (i, pts, mine) => { const s = shots[i]; if (!s || s.done) return; s.done = true; taken++; marks.set(i, 0, -9, 0, 0); Sfx.noise(.06, .3); Sfx.beep(1800, .05, 'square', .08); FX.burst(s.x, 1.6, s.z, [0xffffff, 0xffe9a0], 14, 3, 3, .5, 1.2);
    me.cheer = pal.cheer = .7; if (mine) { ctx.add(pts, s.x, 1.2, s.z); UI.pop(pts > 1 ? 'perfect shot!' : 'nice shot'); ctx.send('snap', [i, pts]); } else UI.pop('photo: ' + s.name); };
  const bump = (pop) => { stun = .55; ctx.add(-1); rumble(70, .35); Sfx.bad(); UI.pop(pop); };
  ctx.on('snap', ([i]) => snap(i, 0, false)); ctx.on('yes', (ci) => accept(ci, false)); ctx.on('fin', () => finish(false));
  ctx.on('glove', () => { gloveOn = false; glove.set(0, 0, -9, 0, 0); glove.flush(); UI.pop('the glove!'); });
  ctx.onPhoto = (cx, cz) => { if (beacon) { beacon.set(0, 0, -9, 0, 0); beacon.flush(); } marks.m.visible = false; for (const w of walkers) w.c.g.visible = false; if (chosen) { chosen.a.g.position.set(cx - .5, 0, cz + 9); chosen.b.g.position.set(cx + .5, 0, cz + 9); } };
  return {
    cam() { const p = me.g.position; Cam.set(p.x, 8.8, p.z + 9.4, p.x, .6, p.z); },
    update(dt, t) {
      const p = me.g.position, g = P.goal; T += dt; warm -= dt;
      if (!opened) { opened = true; if (P.opening) speak(P.opening); }
      const near = shots.findIndex((s) => !s.done && Math.hypot(s.x - p.x, s.z - p.z) < 1.5);
      const cart = P.cart && Math.hypot(P.cart.x - p.x, P.cart.z - p.z) < 2.3;
      if (say) { me.anim(dt, 0); if (Input.just.has('A') || Input.just.has('B')) { if (++say.i < say.lines.length) { UI.say(say.lines[say.i][0], say.lines[say.i][1]); Sfx.move(); } else { const after = say.after; say = null; UI.say(); after && after(); } } }
      else if (stun > 0) { stun -= dt; me.body.rotation.z = Math.sin(t * 40) * .2; me.anim(dt, 0); if (stun <= 0) me.body.rotation.z = 0; }
      else {
        cd -= dt; dash -= dt;
        if (Input.just.has('A')) {
          const c = couples.find((q) => q !== chosen && Math.hypot(q.x - p.x, q.z - p.z) < 2.1);
          if (c) { c.a.face = c.b.face = Math.atan2(p.x - c.x, p.z - c.z);
            if (stage) speak([[c.name, c.bye || 'have a good night, you two.']]);
            else if (c.i === yes) speak(P.yesLines(c.name), () => accept(c.i, true));
            else speak([[c.name, c.no[c.asked++ % c.no.length]]]); }
          else if (cart) { toddies++; warm = 14; ctx.add(1, P.cart.x, 1.4, P.cart.z); Sfx.big(); speak([[P.cart.name, P.cart.lines[Math.min(toddies, P.cart.lines.length) - 1]]]); }
          else if (near >= 0) { const s = shots[near];
            if (ctx.twoP && Math.hypot(s.x - pal.g.position.x, s.z - pal.g.position.z) > 2.8) { UI.pop('both of you in the frame!'); Sfx.back(); }
            else snap(near, Math.abs(Math.sin(t * 2.6 + near)) > .72 ? 3 : 1, true); }
          else if (cd <= 0) { dash = .22; cd = .7; Sfx.dash(); FX.burst(p.x, .3, p.z, 0xffffff, 5, 2, 2, .4, 1); }
        }
        if (toddies > 2 && Math.hypot(Input.axis.x, Input.axis.y) > .1) p.x += Math.sin(t * 4.5) * dt * Math.min(toddies - 2, 3) * .5;         // a lot of hot toddies
        walk(ctx, me, dt, dash > 0 ? 12 : 5.4 * (warm > 0 ? 1.3 : 1));
      }
      if (ctx.twoP) ctx.palNet(dt); else follow(pal, p.x, p.z, dt);
      for (const c of couples) { if (c !== chosen) { c.a.anim(dt, 0); c.b.anim(dt, 0); } }
      if (chosen) { const l = leader.g.position; follow(chosen.a, l.x, l.z, dt, 2.2, 5.6); follow(chosen.b, chosen.a.g.position.x, chosen.a.g.position.z, dt, .9, 5.8);
        if (leader === me && !say && Math.hypot(g.x - p.x, g.z - p.z) < 1.5 && Math.hypot(g.x - chosen.a.g.position.x, g.z - chosen.a.g.position.z) < 5) finish(true); }
      for (let i = 0; i < shots.length; i++) { const s = shots[i]; if (!s.done) marks.set(i, s.x, .06, s.z, 1 + Math.abs(Math.sin(t * 2.6 + i)) * .35, t * .6); }
      marks.flush();
      if (gloveOn) { glove.set(0, gl[0], .5 + Math.sin(t * 3) * .12, gl[1], 1.5, t * 2); glove.flush();
        if (!say && Math.hypot(gl[0] - p.x, gl[1] - p.z) < 1) { gloveOn = false; glove.set(0, 0, -9, 0, 0); glove.flush(); ctx.add(5, gl[0], .8, gl[1]); ctx.send('glove', 0); UI.pop('the glove!'); if (P.gloveLines) speak(P.gloveLines); } }
      const hit = stun <= 0 && dash <= 0 && !say;
      for (const h of haz) { h.a += h.w * dt; const x = h.cx + Math.cos(h.a) * h.r, z = h.cz + Math.sin(h.a) * h.r; h.o.position.set(x, Math.abs(Math.sin(t * 6 + h.r)) * .12, z); h.o.rotation.y = -h.a + (h.w > 0 ? Math.PI : 0);
        if (hit && stun <= 0 && Math.hypot(x - p.x, z - p.z) < .8) bump(P.hazPop || 'oof'); }
      for (const w of walkers) { const u = ((T * w.speed / w.len + w.k * 2) % 2), f = u < 1 ? u : 2 - u, x = w.a[0] + (w.b[0] - w.a[0]) * f, z = w.a[1] + (w.b[1] - w.a[1]) * f;       // there and back again
        w.c.g.position.set(x, 0, z); w.c.face = Math.atan2((w.b[0] - w.a[0]) * (u < 1 ? 1 : -1), (w.b[1] - w.a[1]) * (u < 1 ? 1 : -1)); w.c.anim(dt, .7);
        if (hit && stun <= 0 && Math.hypot(x - p.x, z - p.z) < .75) bump(w.pop || 'excuse me!'); }
      if (beacon) { beacon.set(0, g.x, 2.6 + Math.sin(t * 3) * .2, g.z, 1.7, t * 2); beacon.flush(); }
      if (!say) note(cart ? 'A · hot toddy' : near >= 0 ? `A · photo at ${shots[near].name}` : stage ? (P.escortNote || '') : `photos ${taken}/${shots.length} · ${P.note || ''}`);
      this.cam();
    },
  };
}

/* ============ HEIST: carry, pass, throw and push loot into the van before time runs out ============
   Small gear goes in plastic totes (each has a volume limit); a tote in the van pays for everything in it, with a bonus if full.
   One of you can hold a tote while the other fills it. Big gear cannot be carried: shove it across the floor, faster with two.
   A guard patrols with a flashlight; shelving blocks his view. Everything is event-synced so two phones stay in step. */
function steer(ctx, ch, tx, tz, dt, speed, gap = .3) {          // walk a non-player toward a point, sliding around obstacles
  const p = ch.g.position, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
  if (d <= gap + .03) { ch.anim(dt, 0); return true; }               // the tolerance matters: stepping to exactly `gap` can land a hair outside it forever
  const st = Math.min(speed * dt, d - gap); p.x += dx / d * st; p.z += dz / d * st; ch.face = Math.atan2(dx, dz);
  for (const c of ctx.colliders) { if (c.soft) continue; const ex = p.x - c.x, ez = p.z - c.z, dd = Math.hypot(ex, ez), m = c.r + .35; if (dd < m && dd > .001) { p.x = c.x + ex / dd * m + (-ez / dd) * st * .6; p.z = c.z + ez / dd * m + (ex / dd) * st * .6; } }
  const B = ctx.bounds; p.x = clamp(p.x, B[0], B[1]); p.z = clamp(p.z, B[2], B[3]); ch.anim(dt, .9); return false;
}
export function heist(ctx) {
  const P = ctx.P, me = ctx.me, pal = ctx.pal, B = ctx.bounds = P.bounds, V = P.van, CAP = P.cap, objs = [], hand = { me: null, pal: null };
  const inVan = (x, z) => x > V[0] && x < V[1] && z > V[2] && z < V[3];
  const mk = (type, x, z) => { const T = P.types[type], g = new THREE.Group(), b = new Batch(); b.lo = true; T.build(b); b.build(g); g.position.set(x, 0, z); world.add(g);
    const o = { id: objs.length, type, T, g, x, z, y: 0, vx: 0, vz: 0, vy: 0, fly: 0, held: null, box: null, gone: false, items: [], vol: 0, owner: null, tx: x, tz: z };
    if (T.tote) { o.fill = new THREE.Mesh(new THREE.BoxGeometry(.78, 1, .5), new THREE.MeshLambertMaterial({ color: 0xffd27a })); o.fill.visible = false; g.add(o.fill); }
    if (T.big) { o.col = { x, z, r: T.r }; ctx.colliders.push(o.col); }
    objs.push(o); return o; };
  // layout is seeded so both phones get the same floor
  const spots = P.itemSpots.slice(); for (let i = spots.length - 1; i > 0; i--) { const j = Math.floor(ctx.rnd() * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; }
  let si = 0; for (const [type, n] of P.items) for (let k = 0; k < n && si < spots.length; k++, si++) mk(type, spots[si][0], spots[si][1]);
  for (const [type, x, z] of P.bigs) mk(type, x, z);
  const totes = P.totes.map(([x, z]) => { const t = mk('tote', x, z); t.home = [x, z]; return t; });
  const value = (o) => o.T.tote ? Math.round(o.items.reduce((a, i) => a + i.T.price, 0) * (o.vol >= CAP ? 1.25 : 1)) : o.T.price;
  const weight = (o) => o ? (o.T.tote ? 1 + o.items.reduce((a, i) => a + i.T.w, 0) * .45 : o.T.w) : 0;
  const take = (o, who) => { if (hand[who]) return; o.held = who; hand[who] = o; o.fly = 0; o.owner = who; };
  const letGo = (who) => { const o = hand[who]; hand[who] = null; if (o) o.held = null; return o; };
  const putIn = (o, box) => { if (o.held) hand[o.held] = null; o.held = null; o.fly = 0; o.box = box; o.g.visible = false; box.items.push(o); box.vol += o.T.vol; box.fill.visible = true; box.fill.scale.y = Math.max(.08, box.vol / CAP * .5); box.fill.position.y = .1 + box.fill.scale.y / 2; Sfx.pick(); };
  const deliver = (o, credit) => { if (o.gone) return; if (o.held) hand[o.held] = null; const v = value(o), full = o.T.tote && o.vol >= CAP, ax = o.x, az = o.z; o.held = null;
    if (o.T.tote) { for (const i of o.items) i.gone = true; o.items = []; o.vol = 0; o.fill.visible = false; o.owner = null; o.x = o.home[0]; o.z = o.home[1]; o.y = 0; o.fly = 0; o.g.position.set(o.x, 0, o.z); }     // emptied into the van; the tote goes back on the stack
    else { o.gone = true; o.g.visible = false; if (o.col) ctx.colliders.splice(ctx.colliders.indexOf(o.col), 1); }
    if (v) { FX.confetti(ax, 1.2, az, 24 + Math.min(40, v / 30)); Sfx.big(); } if (credit && v) { ctx.cash(v); UI.pop('+$' + v + (full ? ' full box!' : '')); } };
  const boxNear = (x, z, r) => { let best = null, bd = r; for (const t of totes) { if (t.gone || t.fly || t.vol >= CAP) continue; const d = Math.hypot(t.x - x, t.z - z); if (d < bd) { bd = d; best = t; } } return best; };
  /* events from the other phone */
  ctx.on('grab', (id) => { const o = objs[id]; if (!o || o.gone) return; if (o.held === 'me') { if (ctx.isHost) { ctx.send('grab', id); return; } hand.me = null; o.held = null; } take(o, 'pal'); });       // both grabbed at once: the host keeps it
  ctx.on('drop', ([id, x, z]) => { const o = objs[id]; if (!o) return; if (o.held === 'pal') hand.pal = null; o.held = null; o.fly = 0; o.x = x; o.z = z; o.y = 0; o.owner = 'pal'; });
  ctx.on('put', ([id, bid]) => { const o = objs[id], bx = objs[bid]; if (o && bx && !o.box) putIn(o, bx); });
  ctx.on('throw', ([id, x, z, vx, vz]) => { const o = objs[id]; if (!o) return; if (o.held === 'pal') hand.pal = null; o.held = null; o.x = x; o.z = z; o.y = .9; o.vx = vx; o.vz = vz; o.vy = 4.6; o.fly = .001; o.owner = 'pal'; });
  ctx.on('del', (id) => { const o = objs[id]; if (o) deliver(o, false); });
  ctx.on('mv', ([id, x, z]) => { const o = objs[id]; if (o) { o.tx = x; o.tz = z; o.owner = 'pal'; } });
  /* the guard */
  const G = { c: makeChar(P.guard.look), wp: 0, st: 'patrol', t: 0, who: null, lost: 0, nx: 0, nz: 0, nf: 0 }; G.c.g.position.set(P.patrol[0][0], 0, P.patrol[0][1]); world.add(G.c.g);
  const cone = new THREE.Mesh(new THREE.CircleGeometry(P.guard.range, 12, Math.PI / 2 - P.guard.fov, P.guard.fov * 2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: .2, depthWrite: false })); cone.position.y = .06; G.c.g.add(cone);
  const blocked = (ax, az, bx, bz) => { for (let k = 1; k < 9; k++) { const x = ax + (bx - ax) * k / 9, z = az + (bz - az) * k / 9; for (const r of P.racks) if (x > r[0] && x < r[1] && z > r[2] && z < r[3]) return true; } return false; };
  const sees = (ch) => { const g = G.c.g.position, p = ch.g.position, dx = p.x - g.x, dz = p.z - g.z, d = Math.hypot(dx, dz); if (d > P.guard.range) return false;
    let a = Math.atan2(dx, dz) - G.c.face; a = Math.atan2(Math.sin(a), Math.cos(a)); return Math.abs(a) < P.guard.fov && !blocked(g.x, g.z, p.x, p.z); };
  // getting around the shelving: if the straight line is blocked, walk along the aisle to the nearer cross-corridor, then across
  const zS = Math.max(...P.racks.map((r) => r[3])) + 1.15, zN = Math.min(...P.racks.map((r) => r[2])) - 1.1;
  const cut = (ax, az, bx, bz) => { for (let k = 0; k <= 12; k++) { const x = ax + (bx - ax) * k / 12, z = az + (bz - az) * k / 12; for (const r of P.racks) if (x > r[0] - .55 && x < r[1] + .55 && z > r[2] - .55 && z < r[3] + .55) return true; } return false; };
  const D = P.door, dm = (D.z0 + D.z1) / 2;
  const nav = (ch, tx, tz, dt, speed, gap) => { const p = ch.g.position; let wx = tx, wz = tz;
    if ((p.x - D.x) * (tx - D.x) < 0) { const side = p.x < D.x ? -1 : 1;                                   // the wall is in the way: line up with the loading bay, then go through it
      if (Math.abs(p.z - dm) > 1.3) { wx = D.x + side * 1.3; wz = dm; } else { wx = D.x - side * 1.2; wz = dm; } }
    if (wx === tx && wz === tz ? cut(p.x, p.z, tx, tz) : cut(p.x, p.z, wx, wz)) { const gx = wx, gz = wz;
      const zc = Math.abs(p.z - zS) + Math.abs(gz - zS) <= Math.abs(p.z - zN) + Math.abs(gz - zN) ? zS : zN;
      if (Math.abs(p.z - zc) > .35) { wx = p.x; wz = zc; } else { wx = gx; wz = zc; } }
    const direct = wx === tx && wz === tz, there = steer(ctx, ch, wx, wz, dt, speed, direct ? gap : .12); return direct && there; };
  ctx.on('gd', ([x, z, f, st]) => { G.nx = x; G.nz = z; G.nf = f; if (st !== G.st && st === 'chase') { UI.pop('!'); Sfx.bad(); } G.st = st; }); ctx.on('bust', () => { G.st = 'daze'; G.t = 2.6; });
  /* state */
  let T = P.time, stun = 0, dash = 0, cd = 0, mvT = 0, gdT = 0, noteNow = '', aiState = 'follow', aiBox = null, over = false;
  const note = (t) => { if (t !== noteNow) { noteNow = t; UI.note(t); } };
  if (!ctx.twoP) { take(totes[0], 'pal'); aiBox = totes[0]; }                       // solo: your partner carries a tote and follows you
  UI.score(0, ctx.L.icon, 1);
  ctx.onPhoto = () => { G.c.g.visible = false; for (const o of objs) if (o.held) o.g.visible = false; };
  ctx.heist = { objs, hand, G, totes, get ai() { return aiState; } };
  const dropHeld = (who, x, z) => { const o = letGo(who); if (!o) return null; o.x = x; o.z = z; o.y = 0; return o; };
  return {
    cam() { const p = me.g.position; Cam.set(p.x, 9.6, p.z + 8.6, p.x, .6, p.z - .4); },
    update(dt, t) {
      const p = me.g.position, q = pal.g.position, held = hand.me, ax = Input.axis.x, az = Input.axis.y, moving = Math.hypot(ax, az) > .1;
      T -= dt; cd -= dt; dash -= dt;
      /* you */
      if (stun > 0) { stun -= dt; me.body.rotation.z = Math.sin(t * 40) * .2; me.anim(dt, 0); if (stun <= 0) me.body.rotation.z = 0; }
      else {
        const fx = Math.sin(me.face), fz = Math.cos(me.face);
        if (Input.just.has('A')) {
          if (!held) { let best = null, bd = 1.5; for (const o of objs) { if (o.gone || o.held || o.fly || o.box || o.T.big) continue; const d = Math.hypot(o.x - p.x, o.z - p.z); if (d < bd) { bd = d; best = o; } }
            if (best) { take(best, 'me'); ctx.send('grab', best.id); Sfx.move(); } }
          else if (!held.T.tote) { const bx = boxNear(p.x + fx * .6, p.z + fz * .6, 1.9);
            if (bx && bx.vol + held.T.vol <= CAP) { putIn(held, bx); ctx.send('put', [held.id, bx.id]); }
            else if (bx && bx.held === 'pal' && !ctx.twoP) { UI.pop('no room: running it to the van'); aiState = 'run'; }                    // solo partner takes the tote in when your item will not fit
            else { if (bx) UI.pop('box is full'); const o = dropHeld('me', p.x + fx * .7, p.z + fz * .7); ctx.send('drop', [o.id, o.x, o.z]); } }
          else { const o = dropHeld('me', p.x + fx * .8, p.z + fz * .8); ctx.send('drop', [o.id, o.x, o.z]); }
        }
        if (Input.just.has('B')) {
          if (held) { const sp = Math.max(4.5, 9.5 - weight(held)); letGo('me'); held.x = p.x + fx * .5; held.z = p.z + fz * .5; held.y = .9; held.vx = fx * sp; held.vz = fz * sp; held.vy = 4.6; held.fly = .001; Sfx.jump(); ctx.send('throw', [held.id, held.x, held.z, held.vx, held.vz]); }
          else if (cd <= 0) { dash = .22; cd = .7; Sfx.dash(); }
        }
        const sp = dash > 0 ? 12 : 5.3 * (1 - Math.min(.5, weight(hand.me) * .075));
        const bx0 = p.x, bz0 = p.z; walk(ctx, me, dt, sp);
        // shoving big gear: lean into it. heavy things move slowly; two of you move it faster
        if (moving && !hand.me) for (const o of objs) { if (!o.T.big || o.gone) continue; const dx = o.x - bx0, dz = o.z - bz0, d = Math.hypot(dx, dz);
          if (d < o.T.r + .75 && (dx * ax + dz * az) / d > .35) { const k = 5.3 * dt / o.T.w * (Math.hypot(o.x - q.x, o.z - q.z) < o.T.r + 1.1 ? 1.9 : 1); o.x = clamp(o.x + ax * k, B[0] + o.T.r, V[1] - .4); o.z = clamp(o.z + az * k, B[2] + o.T.r, B[3] - o.T.r);
            for (const c of ctx.colliders) { if (c === o.col || c.soft) continue; const ex = o.x - c.x, ez = o.z - c.z, dd = Math.hypot(ex, ez), m = c.r + o.T.r; if (dd < m && dd > .001) { o.x = c.x + ex / dd * m; o.z = c.z + ez / dd * m; } }
            o.tx = o.x; o.tz = o.z; o.owner = 'me'; mvT += dt; if (mvT > .12) { mvT = 0; ctx.send('mv', [o.id, +o.x.toFixed(2), +o.z.toFixed(2)]); } } }
      }
      /* your partner */
      if (ctx.twoP) ctx.palNet(dt);
      else { const bx = hand.pal;
        if (aiState === 'follow') { nav(pal, p.x, p.z, dt, 5, 1.5); if (bx && bx.T.tote && (bx.vol >= CAP - .01 || (T < 14 && bx.vol > 0))) aiState = 'run'; if (!bx) aiState = 'fetch'; }
        else if (aiState === 'run') { if (!bx) aiState = 'fetch'; else if (nav(pal, P.vanDoor[0], P.vanDoor[1], dt, 5.6, .4) || inVan(q.x, q.z)) { const o = dropHeld('pal', (V[0] + V[1]) / 2, (V[2] + V[3]) / 2); o.owner = 'me'; aiState = 'fetch'; } }
        else { const nx = totes.find((b2) => !b2.gone && !b2.held && !b2.fly && b2.vol < CAP && !inVan(b2.x, b2.z)); if (!nx) nav(pal, p.x, p.z, dt, 5, 1.5); else if (nav(pal, nx.x, nx.z, dt, 5.6, .9)) { take(nx, 'pal'); aiState = 'follow'; } } }
      /* everything that can move */
      for (const o of objs) { if (o.gone || o.box) continue;
        if (o.held) { const h = o.held === 'me' ? me : pal, hp = h.g.position; o.x = hp.x + Math.sin(h.face) * .55; o.z = hp.z + Math.cos(h.face) * .55; o.y = (o.T.tote ? .5 : .75) + h.y; }
        else if (o.fly) { o.fly += dt; o.vy -= 14 * dt; o.x += o.vx * dt; o.z += o.vz * dt; o.y += o.vy * dt; o.x = clamp(o.x, B[0], V[1] - .3); o.z = clamp(o.z, B[2], B[3]);
          const mine = o.owner === 'me';
          if (mine && !o.T.tote && o.fly > .12) { const bx = boxNear(o.x, o.z, 1.05); if (bx && bx.vol + o.T.vol <= CAP && o.y < 1.7) { putIn(o, bx); ctx.send('put', [o.id, bx.id]); UI.pop('in the box!'); continue; } }   // thrown straight into a tote, held or not
          if (o.y <= 0) { o.y = 0; o.fly = 0; if (mine) ctx.send('drop', [o.id, +o.x.toFixed(2), +o.z.toFixed(2)]); } }
        else if (o.T.big) { if (o.owner !== 'me') { o.x = lerp(o.x, o.tx, 1 - Math.exp(-10 * dt)); o.z = lerp(o.z, o.tz, 1 - Math.exp(-10 * dt)); } o.col.x = o.x; o.col.z = o.z; }
        if (!o.held && !o.fly && inVan(o.x, o.z) && (o.owner === 'me' || (!ctx.twoP && o.owner))) { deliver(o, true); ctx.send('del', o.id); if (o.gone) continue; }
        o.g.position.set(o.x, o.y, o.z); if (o.fly) o.g.rotation.y += dt * 9; }
      /* the guard: simulated by the host (or solo), mirrored on the other phone */
      const gp = G.c.g.position;
      if (ctx.twoP && !ctx.isHost) { gp.x = lerp(gp.x, G.nx, 1 - Math.exp(-10 * dt)); gp.z = lerp(gp.z, G.nz, 1 - Math.exp(-10 * dt)); G.c.face = G.nf; G.c.anim(dt, G.st === 'daze' ? 0 : .8); }
      else {
        if (G.st === 'daze') { G.t -= dt; G.c.anim(dt, 0); if (G.t <= 0) G.st = 'patrol'; }
        else if (G.st === 'chase') { const tg = (G.who === 'pal' ? pal : me).g.position; nav(G.c, tg.x, tg.z, dt, P.guard.chase, .2); G.t -= dt; G.lost = sees(G.who === 'pal' ? pal : me) ? 0 : G.lost + dt; if (G.t <= 0 || G.lost > 2.2) G.st = 'patrol'; }
        else { const w = P.patrol[G.wp]; if (steer(ctx, G.c, w[0], w[1], dt, P.guard.walk, .3)) G.wp = (G.wp + 1) % P.patrol.length;
          const who = sees(me) ? 'me' : (ctx.twoP && sees(pal) ? 'pal' : null); if (who) { G.st = 'chase'; G.who = who; G.t = 6; G.lost = 0; UI.pop('!'); Sfx.bad(); } }
        gdT += dt; if (ctx.twoP && gdT > .12) { gdT = 0; ctx.send('gd', [+gp.x.toFixed(2), +gp.z.toFixed(2), +G.c.face.toFixed(2), G.st]); }
      }
      cone.material.opacity = G.st === 'chase' ? .42 : G.st === 'daze' ? .05 : .2; cone.material.color.setHex(G.st === 'chase' ? 0xff5a4a : 0xfff2a0);
      if (G.st !== 'daze' && stun <= 0 && dash <= 0 && Math.hypot(gp.x - p.x, gp.z - p.z) < .95) {          // caught: drop what you carry, pay a fine
        stun = 1.6; const o = dropHeld('me', p.x, p.z); if (o) ctx.send('drop', [o.id, o.x, o.z]); ctx.cash(-P.fine); rumble(160, .5); Sfx.bad(); UI.pop('busted! -$' + P.fine); G.st = 'daze'; G.t = 2.6; ctx.send('bust', 0); }
      /* hud */
      const h2 = hand.me, nb = h2 && !h2.T.tote ? boxNear(p.x, p.z, 2.2) : null;
      note(stun > 0 ? '' : !h2 ? 'A grab · B dash · lean on big gear to push it' : h2.T.tote ? `box ${h2.vol}/${CAP} · $${value(h2)} · A set down · B throw` : `${h2.T.label} $${h2.T.price} · ${nb ? 'A put in box' : 'A drop'} · B throw`);
      UI.time(T); if (T <= 0 && !over) { over = true; ctx.finish(); }
      this.cam();
    },
  };
}

/* ============ CATCH: things rain down, be under the good ones ============ */
export function catcher(ctx) {
  const P = ctx.P, me = ctx.me, pal = ctx.pal, W = P.width || 6, sched = [];
  for (let t = 1.2; t < P.time - 1.5; t += P.every * (.6 + ctx.rnd() * .8)) { const r = ctx.rnd(); sched.push({ t, x: (ctx.rnd() * 2 - 1) * W, kind: r < (P.bad || .2) ? 2 : r > .9 ? 1 : 0, y: 0, on: 0 }); }
  const KC = [P.col || 0xffd77e, P.gold || 0xff7ab6, P.badCol || 0x3a3a4a];
  const POOL = 14, its = P.shapes.map((sh) => items(POOL, sh));     // [good, special, bad]: real objects, drawn from a small pool
  let T = 0, next = 0, dash = 0, cd = 0, dir = 1, palX = 2, palT = 0;
  me.g.position.set(-1, 0, 0); pal.g.position.set(1.5, 0, .2);
  ctx.on('pick', (i) => { const s = sched[i]; if (s && s.on === 1) { s.on = 2; its[s.kind].set(i % POOL, 0, -5, 0, 0); FX.burst(s.x, 1.2, 0, KC[s.kind], 8); pal.cheer = .3; } });
  UI.note(P.note || '');
  return {
    cam() { Cam.set(0, 4.6, 13.5, 0, 3.4, 0); },
    update(dt, t) {
      T += dt; cd -= dt; dash -= dt;
      while (next < sched.length && sched[next].t <= T) { sched[next].on = 1; sched[next].y = 11; next++; }
      const p = me.g.position, ax = Input.axis.x;
      if (Math.abs(ax) > .1) dir = Math.sign(ax);
      if (Input.just.has('A') && cd <= 0) { dash = .18; cd = .55; Sfx.dash(); }
      p.x = clamp(p.x + (dash > 0 ? dir * 16 : ax * 7.5) * dt, -W - .6, W + .6);
      me.face = Math.abs(ax) > .1 ? Math.sign(ax) * 1.57 : 0; me.anim(dt, Math.abs(ax));
      if (ctx.twoP) ctx.palNet(dt);
      else { palT -= dt; if (palT <= 0) { palT = 1 + Math.random() * 2; palX = (Math.random() * 2 - 1) * W; } const q = pal.g.position, d = palX - q.x; if (Math.abs(d) > .2) { q.x += Math.sign(d) * 3 * dt; pal.face = Math.sign(d) * 1.57; pal.anim(dt, .7); } else { pal.face = 0; pal.anim(dt, 0); } }
      for (let i = 0; i < sched.length; i++) { const s = sched[i], it = its[s.kind];
        if (s.on !== 1) continue;
        s.y -= (P.fall || 4.6) * (1 + T / P.time * .7) * dt;
        if (s.y < 1.9 && s.y > .2 && Math.abs(s.x - p.x) < .85) { s.on = 2; it.set(i % POOL, 0, -5, 0, 0); ctx.send('pick', i);
          if (s.kind === 2) { ctx.add(-1); rumble(70, .35); Sfx.bad(); UI.pop(P.badPop || 'nope'); } else { ctx.add(s.kind ? 3 : 1, s.x, 1.4, 0); me.cheer = .3; if (s.kind) UI.pop(P.goldPop || '+3'); } }
        else if (s.y < 0) { s.on = 2; it.set(i % POOL, 0, -5, 0, 0); FX.burst(s.x, .1, 0, KC[s.kind], 4, 1.5, 4, .4, 1); }
        else it.set(i % POOL, s.x + Math.sin(t * 2 + i) * .15, s.y, 0, s.kind === 1 ? 1.5 : 1.25, t * 3 + i); }
      for (const it of its) it.flush();
      UI.time(P.time - T); if (T >= P.time) ctx.finish();
    },
  };
}

/* ============ RUN: three lanes, dodge, jump, grab ============ */
export function runner(ctx) {
  const P = ctx.P, me = ctx.me, pal = ctx.pal, LX = [-1.7, 0, 1.7], rows = [];
  const len = P.time * 11; let z = 22;
  while (z < len) { const free = Math.floor(ctx.rnd() * 3), r = ctx.rnd(), row = { z, obs: [], coin: free, got: false, hit: false };
    if (r < .45) row.obs.push({ l: (free + 1) % 3, low: ctx.rnd() < .35 }); else if (r < .8) { row.obs.push({ l: (free + 1) % 3, low: false }); row.obs.push({ l: (free + 2) % 3, low: ctx.rnd() < .5 }); }
    rows.push(row); z += 7 + ctx.rnd() * 5; }
  const NP = 24, NC = 14;   // pools: about 9 rows are ever on the road at once
  const cars = items(NP, 'car', P.obsCol || [0xe5484d, 0x3d8bd9, 0xf2efe6]), bars = items(NP, 'barrier'), co = items(NC, P.shape || 'coin', P.col || 0xffd77e, 1.3);
  const dash = items(14, 'box', 0xffffff, 1.4), posts = items(12, P.side || 'pine');
  let dist = 0, T = 0, lane = 1, x = 0, stun = 0, palLane = 1, palT = 0;
  me.g.position.set(0, 0, 0); pal.g.position.set(1.7, 0, 1.2); me.face = pal.face = Math.PI;
  UI.note(P.note || '');
  return {
    cam() { Cam.set(0, 4.4, 8, 0, 1.2, -7); },
    update(dt, t) {
      T += dt; const v = (stun > 0 ? 5 : 10 + T * .16); dist += v * dt; stun -= dt;
      if (Input.just.has('LEFT') && lane > 0) { lane--; Sfx.move(); } if (Input.just.has('RIGHT') && lane < 2) { lane++; Sfx.move(); }
      if ((Input.just.has('A') || Input.just.has('UP')) && me.y <= 0) { me.vy = 8.5; Sfx.jump(); }
      me.vy -= 24 * dt; me.y = Math.max(0, me.y + me.vy * dt); if (me.y <= 0) me.vy = 0;
      x = lerp(x, LX[lane], 1 - Math.exp(-16 * dt)); me.g.position.x = x; me.anim(dt, 1.2);
      me.body.rotation.z = stun > 0 ? Math.sin(t * 40) * .25 : (x - LX[lane]) * .25;
      if (ctx.twoP) { ctx.palNet(dt); pal.g.position.z = 1.2; }
      else { palT -= dt; if (palT <= 0) { palT = .5; palLane = lane === 1 ? 2 : lane === 2 ? 1 : 0; } pal.g.position.x = lerp(pal.g.position.x, LX[palLane] + (palLane === lane ? .5 : 0), 1 - Math.exp(-8 * dt)); pal.anim(dt, 1.2); }
      for (let k = 0; k < NP; k++) { cars.set(k, 0, -9, 0, 0); bars.set(k, 0, -9, 0, 0); } for (let k = 0; k < NC; k++) co.set(k, 0, -9, 0, 0);
      for (let i = 0; i < rows.length; i++) { const r = rows[i], rz = dist - r.z, vis = rz > -70 && rz < 8; if (!vis) continue;
        for (let k = 0; k < 2; k++) { const o = r.obs[k], oi = (i * 2 + k) % NP; if (!o) continue;
          if (o.low) bars.set(oi, LX[o.l], 0, rz, 1); else cars.set(oi, LX[o.l], 0, rz, 1);
          if (!r.hit && stun <= 0 && Math.abs(rz) < (o.low ? .6 : 1.5) && o.l === lane && Math.abs(x - LX[lane]) < .8 && !(o.low && me.y > .55)) { r.hit = true; stun = .8; ctx.add(-2); rumble(90, .45); Sfx.bad(); UI.pop(P.hitPop || 'ow'); } }
        if (!r.got) { co.set(i % NC, LX[r.coin], 1 + Math.sin(t * 4 + i) * .12, rz, 1.5, t * 3);
          if (Math.abs(rz) < .9 && Math.abs(x - LX[r.coin]) < .9) { r.got = true; ctx.add(1, LX[r.coin], 1.2, 0); } } }
      for (let i = 0; i < 14; i++) { const dz = ((dist + i * 6) % 84) - 76; dash.m.setMatrixAt(i, _dash.makeScale(.3, .08, 4).setPosition(i % 2 ? -.85 : .85, .02, dz)); }
      for (let i = 0; i < 12; i++) { const dz = ((dist + i * 14) % 84) - 76; posts.set(i, i % 2 ? -(P.sideX || 5.4) : (P.sideX || 5.4), 0, dz, P.sideScale || 1.5, i % 2 ? Math.PI : 0); }
      cars.flush(); bars.flush(); co.flush(); dash.flush(); posts.flush();
      UI.time(P.time - T); if (T >= P.time) ctx.finish();
    },
    dispose() { me.body.rotation.z = 0; },
  };
}
const _dash = new THREE.Matrix4();

/* ============ RHYTHM: ◀  A  ▶ on the beat ============ */
export function rhythm(ctx) {
  const P = ctx.P, me = ctx.me, pal = ctx.pal, beat = 60 / P.bpm, LX = [-1.5, 0, 1.5], LC = [0x7ad7ff, 0xffd77e, 0xff7ab6], TRAVEL = 1.7, Z0 = -17, Z1 = 2;
  const notes = [], beats = Math.floor(P.time / beat);
  for (let b = 6; b < beats - 2; b++) { const r = ctx.rnd(); if (r < .2) continue; const l = Math.floor(ctx.rnd() * 3); notes.push({ t: b * beat, l, st: 0 });
    if (b > 20 && r > .78) notes.push({ t: (b + .5) * beat, l: (l + 1 + Math.floor(ctx.rnd() * 2)) % 3, st: 0 }); }
  const it = items(notes.length, 'puck'); notes.forEach((n, i) => it.color(i, LC[n.l], 1));
  const pads = items(3, 'ring', LC, 1.2), flash = [0, 0, 0];
  me.g.position.set(-3.1, 0, 2); pal.g.position.set(3.1, 0, 2);
  let t0 = null, combo = 0, done = false;
  UI.note('◀    A    ▶');
    ctx.on('hit', () => { pal.cheer = .25; });
  return {
    cam() { Cam.set(0, 6.4, 10.5, 0, .4, -3); },
    update(dt, t) {
      // the chart is locked to the level's song: restart it on the first frame of play and read time off the audio clock
      if (t0 === null) { Music.play(SONGS[ctx.L.id], .7); t0 = Sfx.ctx ? Music.t0 : Sfx.now() + .7; }
      const now = Sfx.now() - t0;
      for (const a of ['LEFT', 'A', 'RIGHT']) if (Input.just.has(a) || (a === 'A' && (Input.just.has('UP') || Input.just.has('DOWN')))) {
        const l = a === 'LEFT' ? 0 : a === 'A' ? 1 : 2; flash[l] = 1; let best = null, bd = .2;
        for (const n of notes) if (!n.st && n.l === l) { const d = Math.abs(n.t - now); if (d < bd) { bd = d; best = n; } }
        if (best) { best.st = 1; combo++; const perfect = bd < .08; ctx.add(perfect ? 3 : 1, LX[l], .8, Z1); ctx.send('hit', l); me.cheer = .25; me.face += 1.57;
          UI.pop(perfect ? (combo > 7 ? `PERFECT ×${combo}` : 'PERFECT') : 'good'); }
        else { combo = 0; ctx.miss(); Sfx.beep(140, .05, 'square', .05); } }
      notes.forEach((n, i) => { const k = 1 - (n.t - now) / TRAVEL;
        if (n.st || k < 0 || k > 1.12) { if (!n.st && k > 1.12) { n.st = 2; combo = 0; ctx.miss(); } it.set(i, 0, -9, 0, 0); return; }
        it.set(i, LX[n.l], .08, lerp(Z0, Z1, k), 1.25 + Math.max(0, k - .9) * 2, 0); });
      for (let l = 0; l < 3; l++) { flash[l] = Math.max(0, flash[l] - dt * 5); pads.set(l, LX[l], .08, Z1, 1.9 + flash[l] * .8, 0); pads.m.setMatrixAt(l, _dash.makeRotationX(Math.PI / 2).scale(_sc.setScalar(1.9 + flash[l] * .8)).setPosition(LX[l], .08, Z1)); }
      it.flush(); pads.flush();
      const bop = Math.abs(Math.sin(now / beat * Math.PI)) * .12; me.anim(dt, .2); me.body.position.y += bop;
      if (ctx.twoP) { pal.anim(dt, .2); pal.body.position.y += bop; } else { pal.anim(dt, .2); pal.body.position.y += bop; pal.face = Math.sin(now / beat * Math.PI / 2) * 1.2; if (Math.random() < dt * .6) pal.cheer = .3; }
      UI.time(P.time - now); if (now >= P.time && !done) { done = true; ctx.finish(); }
    },
  };
}
const _sc = new THREE.Vector3();
