// The four mechanics every memory is built from. Each returns { cam(), update(dt,t), dispose?() }.
// All randomness comes from ctx.rnd (seeded) so two phones build identical levels.
import { THREE, world, Input, Cam, UI, Sfx, Music, rumble, clamp, lerp } from './engine.js';
import { SONGS } from './songs.js';
import { items, FX, makeChar } from './kit.js';

/* shared: stick-relative free movement with circle colliders */
function walk(ctx, ch, dt, speed) {
  const ax = Input.axis.x, az = Input.axis.y, l = Math.hypot(ax, az);
  if (l > .05) {
    const p = ch.g.position; p.x += ax * speed * dt; p.z += az * speed * dt; ch.face = Math.atan2(ax, az);
    const d = Math.hypot(p.x, p.z), R = ctx.R - .5; if (d > R) { p.x *= R / d; p.z *= R / d; }
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
  ctx.on('pick', (i) => pick(i, false));
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
          if (g) { ctx.finish(); return; }
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
