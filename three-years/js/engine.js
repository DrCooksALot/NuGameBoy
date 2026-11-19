// NuGameBoy · Three Years — engine: renderer, post, loop, input, audio, net, UI.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const $ = (s) => document.querySelector(s);
export const isMobile = matchMedia('(pointer:coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
export const params = new URLSearchParams(location.search);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export function rng(seed) { let s = (seed | 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; }

/* ---------- storage ---------- */
export const Store = {
  K: 'nugameboy.threeyears.v1',
  load() { try { return JSON.parse(localStorage.getItem(this.K)) || {}; } catch (e) { return {}; } },
  get(k, d) { const o = this.load(); return k in o ? o[k] : d; },
  set(k, v) { const o = this.load(); o[k] = v; try { localStorage.setItem(this.K, JSON.stringify(o)); } catch (e) {} },
};

/* ---------- renderer + post ---------- */
const screenEl = $('#screen');
const canvas = $('#gl');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, stencil: false, powerPreference: 'high-performance' });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;   // static worlds: bake once per level
export const bakeShadows = () => { renderer.shadowMap.needsUpdate = true; };
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.5, 400);
export const world = new THREE.Group(); world.name = 'world';
scene.add(world);

const FilmShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uFade: { value: 0 }, uVig: { value: 0 }, uGrain: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `precision mediump float; uniform sampler2D tDiffuse; uniform float uTime,uFade,uVig,uGrain; varying vec2 vUv;
    void main(){ vec4 c=texture2D(tDiffuse,vUv); float v=smoothstep(.95,.3,length(vUv-.5));
      c.rgb*=mix(1.,v,uVig); float n=fract(sin(dot(vUv+fract(uTime),vec2(12.9898,78.233)))*43758.5453);
      c.rgb+=(n-.5)*uGrain*(.25+dot(c.rgb,vec3(.33))); c.rgb*=uFade; gl_FragColor=c; }`,
};
const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: isMobile ? 2 : 4 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
export const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .3, .5, .92);
composer.addPass(bloom);
const film = new ShaderPass(FilmShader);
composer.addPass(film);
composer.addPass(new OutputPass());

let pr = Math.min(devicePixelRatio || 1, isMobile ? 1.75 : 2);
function resize() {
  const w = screenEl.clientWidth, h = screenEl.clientHeight;
  if (!w || !h) return;
  renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
  composer.setPixelRatio(pr); composer.setSize(w, h);
  camera.aspect = w / h; camera.fov = camera.aspect < 1.2 ? 54 : 44; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(screenEl);
resize();
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); UI.toast('graphics paused…'); });
canvas.addEventListener('webglcontextrestored', () => { UI.toast('and we are back'); resize(); });

/* recursive disposal; geometries/materials flagged keep are shared caches */
export function disposeTree(obj) {
  obj.traverse((o) => {
    if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose();
    const m = o.material;
    if (m) for (const x of (Array.isArray(m) ? m : [m])) if (!x.userData.keep) { x.map && !x.map.userData.keep && x.map.dispose(); x.dispose(); }
  });
}
export function clearWorld() {
  for (let i = world.children.length - 1; i >= 0; i--) { const c = world.children[i]; world.remove(c); disposeTree(c); }
  scene.fog = null;
}

/* ---------- tweens ---------- */
let tweens = [];
export function tween(dur, fn, e = ease) { return new Promise((res) => tweens.push({ t: 0, dur, fn, e, res })); }
export const wait = (s) => tween(s, () => {}, (x) => x);
export function killTweens() { tweens = []; }
export function fade(to, dur = .6) { const from = film.uniforms.uFade.value; return tween(dur, (k) => { film.uniforms.uFade.value = lerp(from, to, k); }); }

/* ---------- camera rig ---------- */
const _v = new THREE.Vector3();
export const Cam = {
  pos: new THREE.Vector3(0, 8, 14), look: new THREE.Vector3(), tp: new THREE.Vector3(0, 8, 14), tl: new THREE.Vector3(), k: 4, shake: 0,
  set(px, py, pz, lx, ly, lz) { this.tp.set(px, py, pz); this.tl.set(lx, ly, lz); },
  snap() { this.pos.copy(this.tp); this.look.copy(this.tl); },
  // orbit sweep around a point, ending exactly on the current target pose
  orbit(dur, center, r0, h0, a0, a1) {
    const ep = this.tp.clone(), el = this.tl.clone();
    return tween(dur, (k) => {
      const a = lerp(a0, a1, k), blend = ease(clamp((k - .55) / .45, 0, 1));
      _v.set(center.x + Math.sin(a) * r0, h0, center.z + Math.cos(a) * r0);
      this.pos.lerpVectors(_v, ep, blend); this.look.lerpVectors(center, el, blend);
      this.tp.copy(this.pos); this.tl.copy(this.look);
      if (k === 1) { this.tp.copy(ep); this.tl.copy(el); }
    }, (x) => x);
  },
  update(dt) {
    const a = 1 - Math.exp(-this.k * dt);
    this.pos.lerp(this.tp, a); this.look.lerp(this.tl, a);
    camera.position.copy(this.pos);
    if (this.shake > 0) { camera.position.x += (Math.random() - .5) * this.shake; camera.position.y += (Math.random() - .5) * this.shake; this.shake = Math.max(0, this.shake - dt * 1.5); }
    camera.lookAt(this.look);
  },
};

/* ---------- input ---------- */
export const Input = {
  held: new Set(), just: new Set(), axis: { x: 0, y: 0 }, stick: { x: 0, y: 0, on: false }, onDown: null,
  press(a) { if (this.held.has(a)) return; this.held.add(a); this.just.add(a); Sfx.ensure(); this.onDown && this.onDown(a); },
  release(a) { this.held.delete(a); },
  refreshAxis() {
    if (this.stick.on) { this.axis.x = this.stick.x; this.axis.y = this.stick.y; return; }
    const h = this.held; let x = (h.has('RIGHT') ? 1 : 0) - (h.has('LEFT') ? 1 : 0), y = (h.has('DOWN') ? 1 : 0) - (h.has('UP') ? 1 : 0);
    const l = Math.hypot(x, y) || 1; this.axis.x = x / l; this.axis.y = y / l;
  },
};
const haptic = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
export const rumble = (ms = 40, mag = .25) => { haptic(ms); Cam.shake = Math.max(Cam.shake, mag); };
(function wireInput() {
  const KEY = { ArrowUp: 'UP', KeyW: 'UP', ArrowDown: 'DOWN', KeyS: 'DOWN', ArrowLeft: 'LEFT', KeyA: 'LEFT', ArrowRight: 'RIGHT', KeyD: 'RIGHT',
    Space: 'A', Enter: 'A', KeyJ: 'A', KeyZ: 'A', KeyK: 'B', KeyX: 'B', Escape: 'B', Backspace: 'B', Tab: 'SELECT', KeyN: 'SELECT', KeyM: 'START', KeyP: 'START' };
  addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; const a = KEY[e.code]; if (a) { e.preventDefault(); Input.press(a); } }, { passive: false });
  addEventListener('keyup', (e) => { const a = KEY[e.code]; if (a) Input.release(a); });
  addEventListener('blur', () => Input.held.clear());

  document.querySelectorAll('[data-key]').forEach((el) => {
    const k = el.dataset.key;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) {} el.classList.add('active'); haptic(); Input.press(k); }, { passive: false });
    const up = (e) => { e.preventDefault(); el.classList.remove('active'); Input.release(k); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  });

  // analog thumb-stick that also emits digital d-pad presses (menus, lanes, rhythm)
  const st = $('#stick'), knob = $('#knob'); let pid = null; const dirs = { LEFT: 0, RIGHT: 0, UP: 0, DOWN: 0 };
  const setDir = (d, on) => { if (on && !dirs[d]) { dirs[d] = 1; haptic(5); Input.press(d); } else if (!on && dirs[d]) { dirs[d] = 0; Input.release(d); } };
  const move = (e) => {
    const r = st.getBoundingClientRect(), R = r.width / 2; let x = (e.clientX - r.left - R) / (R * .62), y = (e.clientY - r.top - R) / (R * .62);
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    knob.style.transform = `translate(${x * R * .5}px,${y * R * .5}px)`;
    const dead = l < .22; Input.stick.x = dead ? 0 : x; Input.stick.y = dead ? 0 : y; Input.stick.on = true;
    setDir('LEFT', x < -.5); setDir('RIGHT', x > .5); setDir('UP', y < -.5); setDir('DOWN', y > .5);
  };
  const end = (e) => { if (e.pointerId !== pid) return; pid = null; st.classList.remove('live'); knob.style.transform = '';
    Input.stick.x = Input.stick.y = 0; Input.stick.on = false; for (const d in dirs) setDir(d, false); };
  st.addEventListener('pointerdown', (e) => { e.preventDefault(); pid = e.pointerId; try { st.setPointerCapture(pid); } catch (x) {} st.classList.add('live'); Sfx.ensure(); move(e); }, { passive: false });
  st.addEventListener('pointermove', (e) => { if (e.pointerId === pid) move(e); });
  st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);

  // tapping the screen itself is "A" whenever the game is waiting on a card
  screenEl.addEventListener('pointerdown', (e) => { if (UI.tapA && !e.target.closest('[data-i],input,button')) { Input.press('A'); Input.release('A'); } });
  for (const ev of ['contextmenu', 'gesturestart', 'dblclick']) document.addEventListener(ev, (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
})();

/* ---------- audio ---------- */
export const Sfx = {
  ctx: null, out: null, muted: !!Store.get('muted', false), bgm: $('#bgm'),
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC(); this.out = this.ctx.createGain(); this.out.gain.value = this.muted ? 0 : .5; this.out.connect(this.ctx.destination); } catch (e) {}
    if (this.bgm) { this.bgm.volume = .32; this.bgm.muted = this.muted; this.bgm.play().catch(() => {}); }
  },
  now() { return this.ctx ? this.ctx.currentTime : performance.now() / 1000; },
  beep(f = 440, d = .1, type = 'square', vol = .15, when = 0, slide = 0) {
    if (!this.ctx) return; const t = this.ctx.currentTime + when, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(this.out); o.start(t); o.stop(t + d + .03);
  },
  noise(d = .05, vol = .1, when = 0) {
    if (!this.ctx) return; const n = Math.floor(this.ctx.sampleRate * d), b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ctx.createBufferSource(), g = this.ctx.createGain(); s.buffer = b; g.gain.value = vol; s.connect(g); g.connect(this.out); s.start(this.ctx.currentTime + when);
  },
  pick() { this.beep(660, .07, 'square', .14); this.beep(990, .1, 'square', .14, .06); },
  big() { [523, 659, 784, 1046].forEach((f, i) => this.beep(f, .16, 'triangle', .18, i * .09)); },
  bad() { this.beep(180, .18, 'sawtooth', .12, 0, -90); },
  move() { this.beep(520, .04, 'square', .07); },
  ok() { this.beep(720, .07, 'square', .12); this.beep(960, .1, 'triangle', .12, .07); },
  back() { this.beep(240, .09, 'square', .1); },
  jump() { this.beep(300, .16, 'square', .1, 0, 400); },
  dash() { this.noise(.09, .08); },
  duck(v) { if (this.bgm) this.bgm.volume = v; },
  toggleMute() { this.muted = !this.muted; Store.set('muted', this.muted); if (this.out) this.out.gain.value = this.muted ? 0 : .5; if (this.bgm) this.bgm.muted = this.muted; return this.muted; },
};
document.addEventListener('visibilitychange', () => { if (!Sfx.bgm) return; if (document.hidden) Sfx.bgm.pause(); else if (Sfx.ctx) Sfx.bgm.play().catch(() => {}); });

/* ---------- networking: 2 phones, one room code ---------- */
export const Net = {
  role: 'solo', open: false, code: null, h: new Map(), onOpen: null, onClose: null, _t: null,
  get two() { return this.open; }, get isHost() { return this.role !== 'client'; },
  on(t, fn) { this.h.set(t, fn); }, off(t) { this.h.delete(t); },
  send(t, d) { if (this.open && this._t) try { this._t.send({ t, d }); } catch (e) {} },
  _recv(m) { if (!m || !m.t) return; const f = this.h.get(m.t); f && f(m.d); },
  _up() { this.open = true; $('#netBadge').textContent = (this.role === 'host' ? 'P1 · ' : 'P2 · ') + this.code; this.onOpen && this.onOpen(); },
  _down() { if (!this.open) return; this.open = false; $('#netBadge').textContent = 'SOLO'; this.onClose && this.onClose(); },
  close() { try { this._t && this._t.close(); } catch (e) {} this._t = null; this.open = false; this.role = 'solo'; this.code = null; $('#netBadge').textContent = 'SOLO'; },
  newCode() { const C = 'BCDFGHJKMNPQRTVWXYZ2346789'; let s = ''; for (let i = 0; i < 4; i++) s += C[Math.floor(Math.random() * C.length)]; return s; },
  async host() { this.close(); this.role = 'host'; this.code = this.newCode(); this._t = await makeTransport(this, true, this.code); return this.code; },
  async join(code) { this.close(); this.role = 'client'; this.code = code.toUpperCase().trim(); this._t = await makeTransport(this, false, this.code); },
};
let peerLib = null;
function loadPeer() { return peerLib || (peerLib = new Promise((res, rej) => { const s = document.createElement('script'); s.src = './vendor/peerjs.min.js'; s.onload = res; s.onerror = () => { peerLib = null; rej(new Error('offline')); }; document.head.appendChild(s); })); }
async function makeTransport(net, hosting, code) {
  if (params.get('net') === 'local') { // same-browser tabs; used for testing without a signalling server
    const ch = new BroadcastChannel('ty-' + code);
    ch.onmessage = (e) => { const m = e.data; if (m.t === '_hi') { if (hosting) ch.postMessage({ t: '_ok' }); net._up(); } else if (m.t === '_ok') net._up(); else if (m.t === '_bye') net._down(); else net._recv(m); };
    if (!hosting) ch.postMessage({ t: '_hi' });
    return { send: (m) => ch.postMessage(m), close: () => { ch.postMessage({ t: '_bye' }); ch.close(); } };
  }
  await loadPeer();
  return new Promise((res, rej) => {
    const peer = hosting ? new window.Peer('nugb-ty-' + code) : new window.Peer(); let conn = null, done = false;
    const wire = (c) => { conn = c; c.on('open', () => net._up()); c.on('data', (m) => net._recv(m)); c.on('close', () => net._down()); c.on('error', () => net._down()); };
    const api = { send: (m) => conn && conn.open && conn.send(m), close: () => { try { peer.destroy(); } catch (e) {} } };
    peer.on('open', () => { done = true; if (!hosting) wire(peer.connect('nugb-ty-' + code, { reliable: true })); res(api); });
    peer.on('connection', (c) => { if (hosting && !conn) wire(c); });
    peer.on('error', (e) => { if (!done) rej(e); else if (!net.open) UI.toast('could not reach that room'); });
    peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) {} });
  });
}

/* ---------- DOM UI over the 3D screen ---------- */
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export const UI = {
  tapA: false, _menu: null, _toastT: 0,
  cine(on) { screenEl.classList.toggle('cine', on); },
  card(kicker, title, sub) { const c = $('#card'); if (!title) { c.classList.remove('on'); return; }
    c.children[0].textContent = kicker || ''; c.children[1].textContent = title; c.children[3].textContent = sub || ''; c.classList.add('on'); },
  hud(on, title) { $('#hud').classList.toggle('on', on); if (title != null) $('#hudTitle').textContent = title; if (!on) $('#hudNote').textContent = ''; },
  score(n, icon = '♥', mult = 1) { $('#hudScore').innerHTML = `${icon} <b>${n}</b>${mult > 1 ? ` <em>×${mult}</em>` : ''}`; },
  time(s) { const e = $('#hudTime'); e.textContent = s == null ? '' : `${Math.max(0, Math.ceil(s))}s`; e.style.visibility = s == null ? 'hidden' : 'visible'; e.classList.toggle('low', s != null && s < 6); },
  note(t) { $('#hudNote').textContent = t || ''; },
  pop(t) { const p = $('#pop'); p.textContent = t; p.classList.remove('go'); void p.offsetWidth; p.classList.add('go'); },
  toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(this._toastT); this._toastT = setTimeout(() => e.classList.remove('on'), 2200); },
  say(who, text) { const d = $('#dialog'); if (!text) { d.classList.remove('on'); return; } d.querySelector('.who').textContent = who || ''; d.querySelector('.txt').textContent = text; d.classList.add('on'); },
  panel(html, clear = false) { const p = $('#panel'); this._menu = null; if (html == null) { p.classList.remove('on'); p.innerHTML = ''; return p; } p.innerHTML = `<div class="win">${html}</div>`; p.classList.remove('dark'); p.classList.toggle('clear', clear); p.classList.add('on'); return p; },
  // d-pad + tap navigable list. items: [{label, hint, off, fn}]
  menu({ kicker = '', title = '', text = '', items, back, clear = false, sel = 0 }) {
    const p = this.panel(`${kicker ? `<div class="kicker">${esc(kicker)}</div>` : ''}${title ? `<h2>${esc(title)}</h2>` : ''}${text ? `<p>${esc(text)}</p>` : ''}<div class="list"></div>`, clear);
    const list = p.querySelector('.list'), m = { items, sel, back, top: 0 };
    const MAXV = 5;
    const draw = () => { if (m.sel < m.top) m.top = m.sel; if (m.sel >= m.top + MAXV) m.top = m.sel - MAXV + 1;
      list.innerHTML = items.map((it, i) => (i < m.top || i >= m.top + MAXV) ? '' : `<div class="item${i === m.sel ? ' sel' : ''}${it.off ? ' off' : ''}" data-i="${i}"><span>${i === m.sel ? '▸ ' : ''}${esc(it.label)}</span><small>${it.hint || ''}</small></div>`).join(''); };
    list.onpointerdown = (e) => { const el = e.target.closest('[data-i]'); if (!el) return; const i = +el.dataset.i; if (m.sel !== i) { m.sel = i; draw(); Sfx.move(); } else m.input('A'); };
    m.input = (a) => {
      const n = items.length; let s = m.sel;
      if (a === 'UP' || a === 'DOWN') { const d = a === 'UP' ? -1 : 1; for (let k = 0; k < n; k++) { s = (s + d + n) % n; if (!items[s].off) break; } if (s !== m.sel) { m.sel = s; draw(); Sfx.move(); } }
      else if (a === 'A' || a === 'START') { const it = items[m.sel]; if (it && !it.off && it.fn) { Sfx.ok(); it.fn(); } else Sfx.back(); }
      else if (a === 'B' && back) { Sfx.back(); back(); }
    };
    while (items[m.sel] && items[m.sel].off && m.sel < items.length - 1) m.sel++;
    draw(); this._menu = m; return m;
  },
};

/* ---------- main loop ---------- */
export const App = { mode: null, t: 0 };
export function setMode(m) { App.mode = m || null; }
Input.onDown = (a) => {
  if (a === 'SELECT') { UI.toast(Sfx.toggleMute() ? 'sound off' : 'sound on'); return; }
  if (UI._menu) { UI._menu.input(a); return; }
  App.mode && App.mode.down && App.mode.down(a);
};
let last = 0, slow = 0, frames = 0;
export function start() {
  renderer.setAnimationLoop((ms) => {
    const dt = Math.min(.05, (ms - last) / 1000 || .016); last = ms; App.t += dt;
    Input.refreshAxis();
    for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i]; if (!w) continue; w.t += dt; const k = Math.min(1, w.t / w.dur); w.fn(w.e(k)); if (k >= 1) { tweens.splice(tweens.indexOf(w), 1); w.res(); } }
    App.mode && App.mode.update && App.mode.update(dt, App.t);
    Cam.update(dt);
    film.uniforms.uTime.value = App.t;
    composer.render(dt);
    Input.just.clear();
    // adaptive quality: step resolution down, then drop bloom, if the phone is struggling
    if (++frames > 90) { slow = dt > .03 ? slow + dt : Math.max(0, slow - dt * .5);
      if (slow > 1.5) { slow = 0; frames = 0; if (pr > 1.01) { pr = Math.max(1, pr - .35); resize(); } else bloom.enabled = false; } }
  });
}
export function snapshot() { composer.render(0); try { return canvas.toDataURL('image/jpeg', .86); } catch (e) { return ''; } }
export function flash() { film.uniforms.uFade.value = 3.2; return tween(.55, (k) => { film.uniforms.uFade.value = lerp(3.2, 1, k); }, easeOut); }
export { THREE };
