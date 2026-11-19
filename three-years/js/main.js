// Three Years — flow: title → menu → (lobby) → level intro → play → memory card → finale.
import { THREE, $, world, renderer, clearWorld, killTweens, tween, wait, fade, Cam, Input, Sfx, Net, UI, Store, App, setMode, start, snapshot, rng, params, lerp } from './engine.js';
import { Batch, makeChar, FX } from './kit.js';
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
  const sc = titleScene(CONFIG.her.look, CONFIG.him.look); S.amb = [sc.amb];
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
  UI.menu({ kicker: 'memories', title: 'Three years, in order', back: menu, items: LEVELS.map((l, i) => ({ label: `${l.icon} ${l.title}`, hint: l.id in st ? starStr(st[l.id]) : (i <= open ? 'new' : 'locked'), off: i > open && !params.has('all'), fn: () => { S.story = false; go(i); } })) });
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
  const meLook = CONFIG[S.who].look, palLook = CONFIG[S.who === 'her' ? 'him' : 'her'].look;
  const me = makeChar(meLook), pal = makeChar(palLook);
  let mine = 0; S.theirs = 0; S.theirReady = false;
  const net = { x: 0, z: 0, f: 0, y: 0, s: 0, has: false };
  const ctx = S.ctx = { L, P: L.P, R: L.R || 12, rnd: rng(seed), me, pal, colliders: [], amb: [], spawn: { x: 0, z: 4 }, storm: false, done: false,
    get twoP() { return Net.open; },
    send(k, d) { Net.send(k, d); }, on(k, fn) { Net.on(k, fn); },
    add(n, x, y, z) { mine = Math.max(0, mine + n); UI.score(mine + S.theirs, L.icon); Net.send('score', mine); if (n > 0) { Sfx.pick(); if (x != null) FX.burst(x, y, z, L.P.col || 0xffd77e, 10); } },
    palNet(dt) { if (!net.has) { pal.anim(dt, 0); return; } const p = pal.g.position, k = 1 - Math.exp(-14 * dt); p.x = lerp(p.x, net.x, k); p.z = lerp(p.z, net.z, k); pal.y = net.y; pal.face = net.f; pal.anim(dt, net.s); },
    finish() { if (!ctx.done) { ctx.done = true; outro(tok, i, mine); } } };
  Net.on('pos', (d) => { Object.assign(net, d); net.has = true; }); Net.on('score', (n) => { S.theirs = n; UI.score(mine + S.theirs, L.icon); });
  Net.on('ready', () => { S.theirReady = true; });
  const b = new Batch(); L.build(b, ctx); b.build(); S.amb = ctx.amb;
  me.g.position.set(ctx.spawn.x, 0, ctx.spawn.z); pal.g.position.set(ctx.spawn.x + 1.2, 0, ctx.spawn.z + .6); me.face = pal.face = Math.PI; world.add(me.g, pal.g);
  const game = S.game = GAMES[L.game](ctx);

  /* cinematic intro: letterbox, title card, orbit down into the play camera */
  game.cam(); Cam.k = 5; center.set(0, 1.2, L.game === 'runner' || L.game === 'rhythm' ? -8 : 0);
  S.idle = (dt) => { me.anim(dt, 0); pal.anim(dt, 0); };
  setMode({ update(dt, t) { common(dt, t); S.idle(dt, t); } });
  UI.cine(true); UI.card(L.kicker, L.title, L.sub); fade(1, .9);
  await Cam.orbit(5.2, center, 24, 11, -1.1, .35);
  if (tok !== S.run) return;
  UI.card(); UI.cine(false);
  UI.panel(`<div class="kicker">${L.icon} how to play</div><p>${L.how.replace(/\n/g, '<br>')}</p><div class="hint">${two ? 'both players press A' : 'press A or tap'}</div>`, true);
  setB(() => { Net.send('menu'); title(false); });
  await pressA(tok);
  if (Net.open) { Net.send('ready'); UI.panel('<p>waiting for the other player…</p>', true);
    if (Net.isHost) { while (!S.theirReady && Net.open && tok === S.run) await wait(.1); Net.send('start'); }
    else await new Promise((res) => { Net.on('start', res); const iv = setInterval(() => { if (!Net.open || tok !== S.run) { clearInterval(iv); res(); } }, 300); }); }
  if (tok !== S.run) return;
  UI.panel(null); UI.hud(true, L.title); UI.score(0, L.icon); UI.time(L.P.time || null); UI.pop('GO'); Sfx.big(); Cam.k = 4.5;
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

/* ───────── outro: the memory card ───────── */
async function outro(tok, i, mine) {
  const L = LEVELS[i], ctx = S.ctx, me = ctx.me, pal = ctx.pal, total = mine + S.theirs;
  if (S.game && S.game.dispose) { S.game.dispose(); S.game.dispose = null; }
  UI.hud(false); UI.say(); Sfx.big();
  const n = L.stars.filter((s) => total >= s).length, st = stars(); st[L.id] = Math.max(st[L.id] || 0, n); Store.set('stars', st);
  const p = me.g.position; if (L.game !== 'collect') pal.g.position.set(p.x + 1.1, 0, p.z); pal.y = me.y = 0; me.body.rotation.z = 0; me.face = .2; pal.face = -.2;
  S.idle = (dt) => { me.cheer = pal.cheer = .2; me.anim(dt, 0); pal.anim(dt, 0); };
  setMode({ update(dt, t) { common(dt, t); S.idle(dt, t); if (Math.random() < dt * 2.5) FX.confetti(p.x + (Math.random() - .5) * 5, 3 + Math.random() * 2, p.z + (Math.random() - .5) * 3, 16); } });
  UI.cine(true); Cam.k = 2.2; Cam.set(p.x + 2.6, 2.3, p.z + 5.2, p.x + .5, 1.1, p.z);
  FX.confetti(p.x, 2.5, p.z, 70);
  await wait(1.5); if (tok !== S.run) return;
  const snap = snapshot();
  if (L.finale) return finale(tok, snap);
  const cap = CONFIG.captions[L.id] || L.caption, last = i === LEVELS.length - 1, canNext = !Net.open || Net.isHost;
  UI.panel(`<div class="kicker">memory saved · ${L.kicker}</div><div class="stars">${starStr(n)}</div>
    <div class="polaroid" id="pol"><img alt="" src="${snap}"/><span>${cap}</span></div>
    <p>${L.icon} ${total}${Net.open ? ` &nbsp;(you ${mine} + ${S.theirs})` : ''}</p>
    <div class="hint">${canNext ? `A · ${S.story && !last ? 'next memory' : 'back to memories'} &nbsp; B · replay` : 'waiting for player 1…'}</div>`);
  const real = new Image(); real.onload = () => { const im = document.querySelector('#pol img'); if (im) im.src = real.src; }; real.src = `photos/${L.id}.jpg`;
  requestAnimationFrame(() => { const e = $('#pol'); e && e.classList.add('on'); });
  if (!canNext) { setB(null); return; }
  setB(() => go(i));
  await wait(.6); await pressA(tok);
  if (S.story && !last) go(i + 1); else { Net.send('menu'); title(false); }
}

async function finale(tok, snap) {
  const B = CONFIG.birthday, ctx = S.ctx, g = ctx.P.goal;
  Cam.k = 1.6; Cam.set(g.x + 2.2, 3.4, g.z + 9.5, g.x, 2.4, g.z - 1); FX.confetti(g.x, 1.6, g.z - 1.3, 90);
  let ft = 0;
  const cheer = (dt) => { ctx.me.cheer = ctx.pal.cheer = .2; ctx.me.anim(dt, 0); ctx.pal.anim(dt, 0); };
  S.idle = (dt) => { cheer(dt); ft -= dt; if (ft > 0) return; ft = .35 + Math.random() * .5; const c = [0xffd77e, 0xff7ab6, 0x7ad7ff, 0x9bff9b, 0xffffff][(Math.random() * 5) | 0];
    FX.burst(g.x + (Math.random() - .5) * 14, 6 + Math.random() * 5, g.z - 3 - Math.random() * 6, c, 34, 7, 3.5, 1.5, 3); Sfx.noise(.25, .05); Sfx.beep(500 + Math.random() * 500, .25, 'sine', .04, 0, -200); };
  UI.card('November 19', B.heading, ''); await wait(3.4); if (tok !== S.run) return; UI.card();
  UI.panel(`<div class="kicker">♥ for ${CONFIG.her.name}</div><h2>${B.heading}</h2><p>${B.message}</p><div class="hint">A · continue</div>`, true);
  await wait(.8); await pressA(tok);
  if (B.giftImage || B.giftText) {
    UI.panel(`<div class="kicker">one more thing</div>${B.giftImage ? `<div class="polaroid" id="pol" style="width:min(58%,240px)"><img alt="" style="aspect-ratio:auto" src="${B.giftImage}"/><span>${B.giftText || ''}</span></div>` : `<h2>${B.giftText}</h2>`}<div class="hint">A · continue</div>`);
    requestAnimationFrame(() => { const e = $('#pol'); e && e.classList.add('on'); }); Sfx.big(); await wait(1); await pressA(tok);
  }
  UI.panel(`<div class="kicker">the end · for now</div><div class="polaroid on" style="transition:none"><img alt="" src="${snap}"/><span>${CONFIG.captions.birthday || LEVELS[LEVELS.length - 1].caption}</span></div><p>made by ${CONFIG.him.name}, with love.<br>year four loads automatically.</p><div class="hint">A · back to title</div>`);
  await wait(.8); await pressA(tok); Net.send('menu'); title(false);
}

/* ───────── boot ───────── */
addEventListener('error', (e) => console.error('[three-years]', e.message));
start();
title(true).then(() => { $('#boot').classList.add('off'); const j = params.get('join'); if (j) { UI.card(); UI.tapA = false; joinForm(j.slice(0, 4).toUpperCase()); } });
if (params.has('level')) { const i = +params.get('level'); setTimeout(() => play(i, +(params.get('seed') || 7)), 300); }
window.__ty = { S, Net, Input, LEVELS, play, UI, App };
