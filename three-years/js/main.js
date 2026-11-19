// Three Years — flow: title → menu → (lobby) → level intro → play → memory card → finale.
import { THREE, $, world, renderer, clearWorld, killTweens, tween, wait, fade, Cam, Input, Sfx, Net, UI, Store, App, setMode, start, snapshot, flash, bakeShadows, rng, params, lerp } from './engine.js';
import { Batch, makeChar, FX, prop } from './kit.js';
import { LEVELS, titleScene } from './levels.js';
import * as GAMES from './games.js';
import { CONFIG } from '../config.js';

const S = { run: 0, game: null, ctx: null, amb: [], who: Store.get('who', 'her'), story: false, theirs: 0, theirReady: false, idle: null };
const stars = () => Store.get('stars', {});
const starStr = (n) => '★'.repeat(n) + '<i>' + '★'.repeat(3 - n) + '</i>';
const center = new THREE.Vector3();

function common(dt, t) { for (const a of S.amb) a.update(dt, t); FX.update(dt);
  if (S.ctx && S.ctx.storm) { if (Math.random() < dt * .22) { S.flash = 1; Sfx.noise(.5, .05, .15); } S.flash = Math.max(0, (S.flash || 0) - dt * 3.5); renderer.toneMappingExposure = 1.15 + S.flash * 1.6; } }
function reset() { S.run++; killTweens(); if (S.game && S.game.dispose) S.game.dispose(); S.game = null; S.ctx = null; S.amb = []; clearWorld(); renderer.toneMappingExposure = 1.15;
  UI.panel(null); UI.card(); UI.say(); UI.hud(false); UI.cine(false); UI.tapA = false; ['pick', 'hit', 'pos', 'score', 'ready', 'start'].forEach((k) => Net.off(k)); return S.run; }

/* ───────── title ───────── */
async function title(first) {
  const tok = reset(); S.story = false;
  const sc = titleScene(CONFIG.her.look, CONFIG.him.look); S.amb = [sc.amb]; bakeShadows();
  Cam.k = 2; let a = .6;
  setMode({ update(dt, t) { common(dt, t); a += dt * .12; Cam.set(Math.sin(a) * 13, 4.6 + Math.sin(a * .7), Math.cos(a) * 13, 0, 1.4, 0); for (const c of sc.chars) c.anim(dt, 0); },
    down(k) { if ((k === 'A' || k === 'START') && UI.tapA) { Sfx.ok(); menu(); } else if (k === 'B' && bFn && !UI._menu) { Sfx.back(); bFn(); } } });
  Cam.set(Math.sin(a) * 13, 5, Math.cos(a) * 13, 0, 1.4, 0); Cam.snap();
  UI.cine(true); fade(1, 1.2);
  if (first) { UI.card('NU GAMEBOY presents', CONFIG.title, CONFIG.tagline + ' · press A'); UI.tapA = true; } else menu();
  return tok;
}
function menu() {
  UI.card(); UI.tapA = false; UI.cine(false); bFn = null;
  const st = stars(), nextI = Math.max(0, LEVELS.findIndex((l) => !(l.id in st))), done = Object.keys(st).length;
  if (Net.open && !Net.isHost) return UI.panel(`<div class="kicker">player 2 · room ${Net.code}</div><h2>Connected</h2><p>Waiting for player 1 to pick a memory…</p><div class="hint">B · leave room</div>`), setB(() => { Net.close(); menu(); });
  UI.menu({ kicker: Net.open ? `2 players · room ${Net.code}` : 'nu gameboy', title: CONFIG.title, clear: true, items: [
    { label: done ? (done >= LEVELS.length ? 'REPLAY STORY' : 'CONTINUE STORY') : 'START STORY', hint: `${done}/${LEVELS.length}`, fn: () => { S.story = true; go(done >= LEVELS.length ? 0 : nextI); } },
    { label: 'MEMORIES', hint: 'pick a level', fn: select },
    Net.open ? { label: 'LEAVE ROOM', hint: Net.code, fn: () => { Net.close(); menu(); } } : { label: 'TWO PLAYER', hint: '2 phones', fn: lobby },
    { label: Sfx.muted ? 'SOUND: OFF' : 'SOUND: ON', hint: 'select', fn: () => { Sfx.toggleMute(); menu(); } },
  ] });
}
let bFn = null; const setB = (f) => { bFn = f; };
function select() {
  const st = stars(), open = Object.keys(st).length;
  UI.menu({ kicker: 'memories', title: 'Three years, in order', back: menu, items: LEVELS.map((l, i) => ({ label: `${l.icon} ${l.title}`, hint: l.id in st ? `${starStr(st[l.id])} ${Store.get('best', {})[l.id] || 0}` : (i <= open ? 'new' : 'locked'), off: i > open && !params.has('all'), fn: () => { S.story = false; go(i); } })) });
}

/* ───────── two player lobby ───────── */
function lobby() {
  UI.menu({ kicker: 'two player', title: 'Two phones, one room', text: 'One of you hosts and shares the code. Both play the same level together and your scores add up.', back: menu, items: [
    { label: 'HOST A ROOM', hint: 'get a code', fn: host }, { label: 'JOIN A ROOM', hint: 'enter code', fn: () => joinForm() },
    { label: `I AM: ${CONFIG[S.who].name}`, hint: 'tap to swap', fn: () => { S.who = S.who === 'her' ? 'him' : 'her'; Store.set('who', S.who); lobby(); } } ] });
}
async function host() {
  UI.panel('<div class="kicker">hosting</div><p>Opening a room…</p>');
  try { const code = await Net.host(); const url = location.origin + location.pathname + '?join=' + code;
    UI.panel(`<div class="kicker">room code</div><div class="code">${code}</div><p>On the other phone: TWO PLAYER → JOIN, or just open the link.</p><div class="row"><div class="item sel" data-i="0" id="share">SHARE LINK</div></div><div class="hint">waiting for player 2 · B to cancel</div>`);
    $('#share').onpointerdown = async () => { try { if (navigator.share) await navigator.share({ title: 'Three Years', url }); else { await navigator.clipboard.writeText(url); UI.toast('link copied'); } } catch (e) {} };
    setB(() => { Net.close(); lobby(); });
  } catch (e) { UI.toast('could not open a room (offline?)'); lobby(); }
}
function joinForm(pre) {
  UI.panel(`<div class="kicker">join a room</div><input id="code" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="····" value="${pre || ''}"/><div class="row"><div class="item sel" data-i="0" id="join">JOIN</div></div><div class="hint">B to cancel</div>`);
  const inp = $('#code'), doJoin = async () => { const c = inp.value.trim().toUpperCase(); if (c.length < 4) return UI.toast('4 letters'); inp.blur();
    UI.panel('<div class="kicker">joining</div><p>Knocking on room ' + c + '…</p>'); setB(() => { Net.close(); lobby(); });
    try { await Net.join(c); setTimeout(() => { if (!Net.open && Net.code === c) { UI.toast('no answer from that room'); Net.close(); lobby(); } }, 9000); } catch (e) { UI.toast('could not connect'); lobby(); } };
  $('#join').onpointerdown = doJoin; inp.onkeydown = (e) => { if (e.key === 'Enter') doJoin(); };
  setB(lobby); if (pre) doJoin(); else if (!('ontouchstart' in window)) inp.focus();
}
Net.onOpen = () => { Sfx.big(); UI.toast('player 2 connected'); if (Net.isHost) Net.send('hello', { who: S.who }); menu(); };
Net.onClose = () => { UI.toast('other player left — solo now'); S.theirReady = true; if (!S.ctx) { Net.close(); menu(); } };
Net.on('hello', (d) => { S.who = d.who === 'her' ? 'him' : 'her'; });
Net.on('go', (d) => { S.story = d.story; play(d.i, d.seed); });
Net.on('menu', () => title(false));

/* ───────── level ───────── */
function go(i) { const seed = (Math.random() * 1e9) | 0; Net.send('go', { i, seed, story: S.story }); play(i, seed); }
const pressA = (tok) => new Promise((res) => { UI.tapA = true; const m = { update: (dt, t) => { common(dt, t); S.idle && S.idle(dt, t); }, down(k) { if ((k === 'A' || k === 'START') && tok === S.run) { UI.tapA = false; Sfx.ok(); res(); } else if (k === 'B' && bFn) bFn(); } }; setMode(m); });

async function play(i, seed) {
  await fade(0, .45);
  const tok = reset(), L = LEVELS[i], two = Net.open;
  const other = S.who === 'her' ? 'him' : 'her', fit = L.outfit || {};
  const meLook = { ...CONFIG[S.who].look, ...fit[S.who] }, palLook = { ...CONFIG[other].look, ...fit[other] };
  const me = makeChar(meLook), pal = makeChar(palLook);
  let mine = 0; S.theirs = 0; S.theirReady = false;
  const net = { x: 0, z: 0, f: 0, y: 0, s: 0, has: false };
  const ctx = S.ctx = { L, P: L.P, R: L.R || 12, rnd: rng(seed), me, pal, colliders: [], amb: [], spawn: { x: 0, z: 4 }, storm: false, done: false,
    get twoP() { return Net.open; },
    send(k, d) { Net.send(k, d); }, on(k, fn) { Net.on(k, fn); },
    // every good thing in a row builds a streak; every 5 raises the multiplier (max x4). getting hit resets it.
    streak: 0, get mult() { return Math.min(4, 1 + Math.floor(this.streak / 5)); },
    add(n, x, y, z) {
      if (n > 0) { const m0 = this.mult; this.streak++; n *= m0; if (this.mult > m0) { UI.pop('×' + this.mult); Sfx.big(); } else Sfx.pick(); if (x != null) FX.burst(x, y, z, L.P.col || 0xffd77e, 8 + m0 * 3); }
      else this.streak = 0;
      mine = Math.max(0, mine + n); UI.score(mine + S.theirs, L.icon, this.mult); Net.send('score', mine); },
    miss() { this.streak = 0; UI.score(mine + S.theirs, L.icon, 1); },
    palNet(dt) { if (!net.has) { pal.anim(dt, 0); return; } const p = pal.g.position, k = 1 - Math.exp(-14 * dt); p.x = lerp(p.x, net.x, k); p.z = lerp(p.z, net.z, k); pal.y = net.y; pal.face = net.f; pal.anim(dt, net.s); },
    finish() { if (!ctx.done) { ctx.done = true; outro(tok, i, mine); } } };
  Net.on('pos', (d) => { Object.assign(net, d); net.has = true; }); Net.on('score', (n) => { S.theirs = n; UI.score(mine + S.theirs, L.icon, ctx.mult); });
  Net.on('ready', () => { S.theirReady = true; });
  const b = new Batch(); L.build(b, ctx); b.build(); S.amb = ctx.amb; bakeShadows();
  me.g.position.set(ctx.spawn.x, 0, ctx.spawn.z); pal.g.position.set(ctx.spawn.x + 1.2, 0, ctx.spawn.z + .6); me.face = pal.face = Math.PI; world.add(me.g, pal.g);
  const game = S.game = GAMES[L.game](ctx);

  /* intro: area-name banner, a gentle push-in to the play camera */
  game.cam(); const ep = Cam.tp.clone(), el = Cam.tl.clone();
  Cam.pos.set(ep.x, ep.y + 5, ep.z + 7); Cam.look.copy(el); Cam.k = 1.5;
  S.idle = (dt) => { me.anim(dt, 0); pal.anim(dt, 0); };
  setMode({ update(dt, t) { common(dt, t); S.idle(dt, t); } });
  UI.card(L.kicker, L.title, L.sub); fade(1, .6);
  await wait(2.6);
  if (tok !== S.run) return;
  UI.card(); UI.cine(false);
  UI.panel(`<div class="kicker">${L.icon} how to play</div><p>${L.how.replace(/\n/g, '<br>')}</p><div class="hint">${two ? 'both players press A' : 'press A or tap'}</div>`, true);
  setB(() => { Net.send('menu'); title(false); });
  await pressA(tok);
  if (Net.open) { Net.send('ready'); UI.panel('<p>waiting for the other player…</p>', true);
    if (Net.isHost) { while (!S.theirReady && Net.open && tok === S.run) await wait(.1); Net.send('start'); }
    else await new Promise((res) => { Net.on('start', res); const iv = setInterval(() => { if (!Net.open || tok !== S.run) { clearInterval(iv); res(); } }, 300); }); }
  if (tok !== S.run) return;
  UI.panel(null); UI.hud(true, L.title); UI.score(0, L.icon, 1); UI.time(L.P.time || null); Cam.k = 4.5;
  setMode({ update(dt, t) { common(dt, t); S.idle(dt, t); game.cam(); } });
  for (const n of ['3', '2', '1']) { UI.pop(n); Sfx.beep(440, .12, 'square', .14); await wait(.6); if (tok !== S.run) return; }
  UI.pop('GO'); Sfx.beep(880, .3, 'square', .16);
  let acc = 0;
  setMode({ update(dt, t) { common(dt, t); if (ctx.done) return; game.update(dt, t);
      acc += dt; if (Net.open && acc > .07) { acc = 0; const p = me.g.position; Net.send('pos', { x: +p.x.toFixed(2), z: +p.z.toFixed(2), f: +me.face.toFixed(2), y: +me.y.toFixed(2), s: Math.min(1.2, Math.hypot(Input.axis.x, Input.axis.y) + (L.game === 'runner' ? 1 : 0)) }); } },
    down(k) { if (k === 'START') pause(tok); } });
}
function pause(tok) {
  if (Net.open) return UI.toast('no pausing in 2 player');
  if (S.ctx.L.game === 'rhythm') return UI.toast('the band plays on');
  const before = App.mode, resume = () => { UI.panel(null); setMode(before); };
  setMode({ update() {} });
  UI.menu({ kicker: 'paused', title: 'Take a breath', back: resume, items: [{ label: 'RESUME', fn: resume }, { label: 'QUIT TO MENU', fn: () => title(false) }] });
}

/* ───────── outro: score card ───────── */
async function outro(tok, i, mine) {
  const L = LEVELS[i], ctx = S.ctx, me = ctx.me, pal = ctx.pal, total = mine + S.theirs;
  if (S.game && S.game.dispose) { S.game.dispose(); S.game.dispose = null; }
  UI.hud(false); UI.say(); Sfx.big();
  const n = L.stars.filter((s) => total >= s).length, st = stars(); st[L.id] = Math.max(st[L.id] || 0, n); Store.set('stars', st);
  const bests = Store.get('best', {}), prev = bests[L.id] || 0, record = total > prev; if (record) { bests[L.id] = total; Store.set('best', bests); }
  const p = me.g.position; if (L.game !== 'collect') pal.g.position.set(p.x + 1.1, 0, p.z); pal.y = me.y = 0; me.body.rotation.z = 0; me.face = .2; pal.face = -.2;
  S.idle = (dt) => { me.cheer = pal.cheer = .2; me.anim(dt, 0); pal.anim(dt, 0); };
  setMode({ update(dt, t) { common(dt, t); S.idle(dt, t); if (Math.random() < dt * 2.5) FX.confetti(p.x + (Math.random() - .5) * 5, 3 + Math.random() * 2, p.z + (Math.random() - .5) * 3, 16); } });
  UI.cine(true); Cam.k = 2.2; Cam.set(p.x + 2.6, 2.3, p.z + 5.2, p.x + .5, 1.1, p.z);
  FX.confetti(p.x, 2.5, p.z, 70);
  await wait(1.5); if (tok !== S.run) return;
  const snap = await photo(tok, L, ctx); if (tok !== S.run) return;
  if (L.finale) return finale(tok, snap);
  const last = i === LEVELS.length - 1, canNext = !Net.open || Net.isHost, need = L.stars[Math.min(n, 2)];
  UI.panel(`<div class="kicker">${L.kicker}</div>
    <div class="polaroid" id="pol"><img alt="" src="${snap}"/><span>${L.caption}</span></div>
    <p><span class="stars" style="font-size:18px;letter-spacing:3px">${starStr(n)}</span> &nbsp; <b style="color:var(--gold);font-size:15px">${L.icon} ${total}</b></p>
    <p>${Net.open ? `you ${mine} + ${S.theirs} &nbsp;·&nbsp; ` : ''}${record ? 'new best!' : 'best ' + prev}${n < 3 ? ` &nbsp;·&nbsp; next ★ at ${need}` : ''}</p>
    <div class="hint">${canNext ? `A · ${S.story && !last ? 'next level' : 'level select'} &nbsp; B · retry` : 'waiting for player 1…'}</div>`).classList.add('dark');
  requestAnimationFrame(() => requestAnimationFrame(() => { const e = $('#pol'); e && e.classList.add('on'); }));
  if (!canNext) { setB(null); return; }
  setB(() => go(i));
  await wait(.6); await pressA(tok);
  if (S.story && !last) go(i + 1); else { Net.send('menu'); title(false); }
}

/* the reward: pose the two of them in the diorama, flash, keep the picture */
async function photo(tok, L, ctx) {
  const me = ctx.me, pal = ctx.pal, her = S.who === 'her' ? me : pal, him = her === me ? pal : me;
  const [cx, cz] = L.shot || [me.g.position.x, me.g.position.z];
  her.g.position.set(cx - .52, 0, cz); him.g.position.set(cx + .52, 0, cz);
  for (const c of [her, him]) { c.y = 0; c.cheer = 0; c.body.position.y = 0; c.face = 0; c.body.rotation.z = 0; }
  her.hold = [[0, .12], [-1.45, -.22]]; him.hold = [[-1.45, .22], [0, -.12]];
  
  const pr = prop(L.prop); pr.scale.setScalar(1.5); pr.position.set(cx, .62, cz + .25); world.add(pr);
  FX.burst(cx, 2.1, cz, [0xff7ab6, 0xff9ab8, 0xffffff], 10, 1.6, 1.5, 1.6, 1.4);
  S.idle = (dt) => { her.anim(0, 0); him.anim(0, 0); };
  setMode({ update(dt, t) { common(dt, t); S.idle(dt, t); } });
  Cam.k = 60; Cam.set(cx, 2.3, cz + 3.6, cx, 1.0, cz); Cam.snap();
  await wait(.9); if (tok !== S.run) return '';
  const snap = snapshot(); Sfx.noise(.07, .35); Sfx.beep(1800, .05, 'square', .08); flash();
  await wait(.75); return snap;
}

async function finale(tok, snap) {
  const B = CONFIG.birthday, ctx = S.ctx, g = ctx.P.goal;
  UI.cine(true);
  Cam.k = 1.6; Cam.set(g.x, 3, g.z + 7.6, g.x, 2.3, g.z - 1); FX.confetti(g.x, 1.6, g.z - 1.3, 90);
  let ft = 0;
  S.idle = (dt) => { ctx.me.anim(0, 0); ctx.pal.anim(0, 0); ft -= dt; if (ft > 0) return; ft = .35 + Math.random() * .5; const c = [0xffd77e, 0xff7ab6, 0x7ad7ff, 0x9bff9b, 0xffffff][(Math.random() * 5) | 0];
    FX.burst(g.x + (Math.random() - .5) * 14, 6 + Math.random() * 5, g.z - 3 - Math.random() * 6, c, 34, 7, 3.5, 1.5, 3); Sfx.noise(.25, .05); Sfx.beep(500 + Math.random() * 500, .25, 'sine', .04, 0, -200); };
  UI.card(B.kicker, B.heading, ''); await wait(4); if (tok !== S.run) return; UI.card();
  for (const para of B.message) {
    UI.panel(`<p style="font-size:14px;line-height:1.6;max-width:28ch">${para}</p><div class="hint">▼ A</div>`, true);
    await wait(.7); await pressA(tok); if (tok !== S.run) return;
  }
  UI.panel(`<div class="polaroid" id="pol"><img alt="" src="${snap}"/><span>${LEVELS[LEVELS.length - 1].caption}</span></div><h2 style="font-size:clamp(17px,5.4vmin,26px)">${B.heading}</h2><p>${B.signoff}</p><div class="hint">A · back to title</div>`).classList.add('dark');
  requestAnimationFrame(() => requestAnimationFrame(() => { const e = $('#pol'); e && e.classList.add('on'); }));
  await wait(.8); await pressA(tok); Net.send('menu'); title(false);
}

/* ───────── boot ───────── */
addEventListener('error', (e) => console.error('[three-years]', e.message));
start();
title(true).then(() => { $('#boot').classList.add('off'); const j = params.get('join'); if (j) { UI.card(); UI.tapA = false; joinForm(j.slice(0, 4).toUpperCase()); } });
if (params.has('level')) { const i = +params.get('level'); setTimeout(() => play(i, +(params.get('seed') || 7)), 300); }
window.__ty = { S, Net, Input, LEVELS, play, UI, App };
