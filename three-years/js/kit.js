// Low-poly building kit: merged static batches, characters, sky, particles.
import { THREE, world, scene, clamp } from './engine.js';

const keep = (x) => { x.userData.keep = true; return x; };
const G = {
  box: keep(new THREE.BoxGeometry(1, 1, 1).toNonIndexed()),
  ball: keep(new THREE.SphereGeometry(1, 14, 10).toNonIndexed()),
  cyl: new Map(),
  getCyl(top, segs) { if (segs > 4) segs = Math.max(12, segs * 2); const k = top.toFixed(2) + ':' + segs; let g = this.cyl.get(k); if (!g) { g = keep(new THREE.CylinderGeometry(top, 1, 1, segs).toNonIndexed()); this.cyl.set(k, g); } return g; },
};
const _m = new THREE.Matrix4(), _n = new THREE.Matrix3(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color(), _v = new THREE.Vector3();

/* Batch: every static piece of a diorama is baked into ONE lit mesh + ONE glow mesh (2 draw calls). */
export class Batch {
  constructor() { this.p = []; this.n = []; this.c = []; this.gp = []; this.gc = []; this.i = 0; }
  add(geo, color, glow = 0) {
    const pos = geo.attributes.position, nor = geo.attributes.normal; _n.getNormalMatrix(_m); _c.set(color);
    const j = glow ? glow : 1 + (((this.i++ * 7919) % 13) / 13 - .5) * .1; // subtle per-piece tint variation
    const P = glow ? this.gp : this.p, C = glow ? this.gc : this.c;
    for (let i = 0; i < pos.count; i++) {
      _v.fromBufferAttribute(pos, i).applyMatrix4(_m); P.push(_v.x, _v.y, _v.z);
      if (!glow) { _v.fromBufferAttribute(nor, i).applyMatrix3(_n).normalize(); this.n.push(_v.x, _v.y, _v.z); }
      C.push(_c.r * j, _c.g * j, _c.b * j);
    }
    return this;
  }
  _mat(x, y, z, sx, sy, sz, rx, ry, rz) { _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz)); }
  // y is always the BASE of the piece
  box(x, y, z, w, h, d, col, ry = 0, glow = 0, rx = 0, rz = 0) { this._mat(x, y + h / 2, z, w, h, d, rx, ry, rz); return this.add(G.box, col, glow); }
  cyl(x, y, z, r, h, col, top = 1, segs = 8, glow = 0) { this._mat(x, y + h / 2, z, r, h, r, 0, 0, 0); return this.add(G.getCyl(top, segs), col, glow); }
  cone(x, y, z, r, h, col, segs = 6, glow = 0) { return this.cyl(x, y, z, r, h, col, 0.001, segs, glow); }
  ball(x, y, z, r, col, glow = 0, sy = 1) { this._mat(x, y, z, r, r * sy, r, 0, 0, 0); return this.add(G.ball, col, glow); }
  build(parent = world) {
    const out = new THREE.Group();
    if (this.p.length) { const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); m.matrixAutoUpdate = false; m.castShadow = m.receiveShadow = true; out.add(m); }
    if (this.gp.length) { const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.gp, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.gc, 3));
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })); m.matrixAutoUpdate = false; out.add(m); }
    this.p = this.n = this.c = this.gp = this.gc = null;
    parent.add(out); return out;
  }
}

/* ---------- props ---------- */
let checker = null;
function checkerTex() { if (checker) return checker; const cv = document.createElement('canvas'); cv.width = cv.height = 2; const c = cv.getContext('2d');
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, 2, 2); c.fillStyle = '#e4efdc'; c.fillRect(0, 0, 1, 1); c.fillRect(1, 1, 1, 1);
  checker = new THREE.CanvasTexture(cv); checker.wrapS = checker.wrapT = THREE.RepeatWrapping; checker.magFilter = THREE.NearestFilter; checker.colorSpace = THREE.SRGBColorSpace; checker.userData.keep = true; return checker; }
/* classic two-tone checkerboard turf */
export function turf(w, d, col, x = 0, z = 0, round = 0) {
  const t = checkerTex().clone(); t.needsUpdate = true; t.repeat.set(w / 2, d / 2);
  const m = new THREE.Mesh(round ? new THREE.CircleGeometry(round, 40) : new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ color: col, map: t }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, .012, z); m.receiveShadow = true; world.add(m); return m;
}
export function island(b, R, top = 0x4f8a5b, side = 0x5b4a3e, thick = .7) {
  b.cyl(0, -thick, 0, R, thick, top, 1, 20); turf(R * 2, R * 2, top, 0, 0, R - .02);
  b.cyl(0, -thick - R * .75, 0, R * .18, R * .75, side, 5.2, 9);
  b.cyl(R * .3, -thick - R * .95, -R * .2, R * .08, R * .5, side, 3, 6);
}
export function tree(b, x, z, s = 1, col = 0x3fa052) { b.cyl(x, 0, z, .14 * s, .9 * s, 0x8a5a36, .7, 6); b.ball(x, 1.5 * s, z, .8 * s, col, 0, 1.1); b.ball(x + .3 * s, 1.95 * s, z + .1, .5 * s, col); }
export function pine(b, x, z, s = 1, col = 0x2f9a5c) { b.cyl(x, 0, z, .12 * s, .5 * s, 0x8a5a36, 1, 6); b.cone(x, .4 * s, z, .8 * s, 1.1 * s, col); b.cone(x, 1.05 * s, z, .6 * s, 1 * s, col); b.cone(x, 1.7 * s, z, .38 * s, .8 * s, col); }
export function lamp(b, x, z, col = 0xffd9a0, h = 2.2) { b.cyl(x, 0, z, .07, h, 0x2b2b3a, 1, 6); b.ball(x, h + .15, z, .2, col, 3); }
export function house(b, x, z, w, h, d, col, roof = 0x6a3f80, ry = 0, lit = 0xffd27a) {
  b.box(x, 0, z, w, h, d, col, ry); b.box(x, h, z, w * 1.08, .18, d * 1.08, roof, ry);
  const c = Math.cos(ry), s = Math.sin(ry), f = d / 2 + .02;
  for (let i = -1; i <= 1; i += 2) for (let fl = .55; fl < h - .5; fl += 1.1)
    b.box(x + c * i * w * .25 + s * f, fl, z - s * i * w * .25 + c * f, .34, .46, .05, lit, ry, ((i + fl * 3) | 0) % 3 ? 2.2 : .25);
}
export function stringLights(b, x1, z1, x2, z2, y, cols = [0xffd27a, 0xff7ab6, 0x7ad7ff], n = 9, sag = .5) {
  for (let i = 0; i <= n; i++) { const t = i / n; b.ball(x1 + (x2 - x1) * t, y - Math.sin(t * Math.PI) * sag, z1 + (z2 - z1) * t, .09, cols[i % cols.length], 3.2); }
}
export function stall(b, x, z, ry, col, col2 = 0xf2efe6) {
  const c = Math.cos(ry), s = Math.sin(ry);
  b.box(x, 0, z, 1.9, .8, .8, 0x7a5a3a, ry);
  for (let i = -1; i <= 1; i += 2) b.cyl(x + c * i * .9, 0, z - s * i * .9, .05, 2, 0x3b3030, 1, 5);
  for (let i = -2; i <= 2; i++) b.box(x + c * i * .42, 2, z - s * i * .42, .42, .16, 1.3, i % 2 ? col : col2, ry);
}

/* ---------- characters: 16-bit pixel sprites standing in the 3D world ---------- */
const shadowGeo = keep(new THREE.CircleGeometry(.42, 14).rotateX(-Math.PI / 2));
const shadowMat = keep(new THREE.MeshBasicMaterial({ color: 0x1a2a1a, transparent: true, opacity: .3, depthWrite: false }));
const FW = 24, FH = 30, NF = 7;   // frames: front idle/step, back idle/step, side idle/step, cheer
const css = (n, k = 1) => { _c.setHex(n); return `rgb(${Math.round(Math.min(1, _c.r * k) * 255)},${Math.round(Math.min(1, _c.g * k) * 255)},${Math.round(Math.min(1, _c.b * k) * 255)})`; };
function hexCss(n, k = 1) { const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return `rgb(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0})`; }
function drawFrame(G, o, dir, step, cheer) {
  const put = (x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < FW && y < FH) G[y][x] = c; };
  const ell = (cx, cy, rx, ry, c) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1) put(x, y, c); };
  const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
  const skin = hexCss(o.skin), hair = hexCss(o.hair), hair2 = hexCss(o.hair2 || o.hair, o.hair2 ? 1 : 1.5), top = hexCss(o.top), topD = hexCss(o.top, .76), legs = hexCss(o.legs), shoe = hexCss(o.legs, .55);
  const curly = o.style === 'curly', dress = curly || o.style === 'long' || o.style === 'bun', eye = '#2a1820', bob = step ? 1 : 0, side = dir === 'side';
  // legs + feet
  if (side) { if (step) { rect(8, 26, 3, 2, shoe); rect(14, 26, 3, 2, shoe); if (!dress) { rect(9, 23, 3, 3, legs); rect(13, 23, 3, 3, legs); } } else { rect(11, 26, 4, 2, shoe); if (!dress) rect(10, 23, 4, 3, legs); } }
  else { rect(8, 26 - (step ? 1 : 0), 3, 2, shoe); rect(13, 26, 3, 2, shoe); if (!dress) { rect(8, 23, 3, 3, legs); rect(13, 23, 3, 3, legs); } }
  // body
  const by = 17 + bob;
  if (dress) { for (let y = by; y < 26; y++) { const w = (side ? 3 : 4) + Math.floor((y - by) * .55); rect(12 - w, y, w * 2, 1, y > 23 ? topD : top); } if (o.dots && dir !== 'back') { const d = hexCss(o.dots); put(10, by + 3, d); put(13, by + 5, d); put(11, by + 6, d); put(14, by + 2, d); } else if (dir === 'front') { put(11, by + 3, '#ffd77e'); put(13, by + 5, '#ffd77e'); } }
  else { rect(side ? 9 : 7, by, side ? 6 : 10, 24 - by, top); rect(side ? 9 : 7, 22, side ? 6 : 10, 2, topD); if (o.tie && dir === 'front') { rect(11, by, 2, 2, '#f2efe6'); rect(11, by + 2, 2, 3, hexCss(o.tie)); } }
  // arms
  if (cheer) { rect(4, 11, 2, 7, top); rect(18, 11, 2, 7, top); rect(4, 9, 2, 2, skin); rect(18, 9, 2, 2, skin); }
  else if (side) { rect(11, by + 1, 2, 5, topD); rect(11, by + 6, 2, 1, skin); }
  else { rect(5, by + 1, 2, 5, top); rect(17, by + 1, 2, 5, top); rect(5, by + 6, 2, 1, skin); rect(17, by + 6, 2, 1, skin); }
  // head
  const hy = bob, fx = side ? 13 : 12;
  if (curly) { ell(side ? 10.5 : 12, 9 + hy, 10.5, 9.5, hair); for (const [x, y] of [[3, 6], [5, 2.5], [9, 1], [14, 1], [18.5, 2.5], [21, 6], [2.5, 11], [21.5, 11], [4, 15], [20, 15]]) if (!side || x < 16) ell(x, y + hy, 2.6, 2.6, hair); }
  else if (dress) { ell(side ? 11 : 12, 9 + hy, 8.6, 8.4, hair); rect(side ? 3 : 4, 9 + hy, side ? 8 : 16, 9, hair); }
  else ell(side ? 11.4 : 12, 8 + hy, 7.5, 7, hair);
  if (o.style === 'bun') ell(12, 1.5 + hy, 2.6, 2.4, hair);
  if (dir === 'back') { ell(12, 10.5 + hy, 6.6, 6.2, hair); rect(9, 16 + hy, 6, 1, skin);
    if (curly) for (const [x, y, c] of [[8, 7, hair2], [13, 5, hair2], [16, 10, hair2], [10, 12, hair2], [14, 14, hair]]) ell(x, y + hy, 2.2, 2, c); return; }
  ell(fx, 10.5 + hy, 6.6, 6.2, skin);
  if (curly) { for (const [x, y, c] of [[7, 5, hair2], [10.5, 4, hair], [14, 4, hair2], [17, 5, hair], [5.5, 8, hair], [18.5, 8, hair2]]) if (!side || x < 17) ell(x + (side ? .6 : 0), y + hy, 2.3, 2.1, c); for (const [x, y] of [[4, 4], [9, 1], [3, 10]]) { put(x, y + hy, hair2); put(x + 1, y + hy, hair2); } if (side) rect(5, 7 + hy, 4, 9, hair); }
  else if (dress) { rect(fx - 6, 4 + hy, 12, 3, hair); if (side) rect(4, 6 + hy, 4, 11, hair); }
  else { rect(fx - 6, 3 + hy, 12, 3, hair); rect(fx - 7, 5 + hy, 3, 3, hair); if (!side) rect(16, 5 + hy, 3, 3, hair); else rect(5, 5 + hy, 4, 7, hair); rect(fx - 4, 3 + hy, 5, 1, hair2); }
  if (o.cap) { const c = hexCss(o.cap); rect(fx - 7, 2 + hy, 14, 4, c); rect(side ? fx : fx - 8, 6 + hy, side ? 9 : 16, 1, c); }
  // face
  if (side) { rect(16, 10 + hy, 2, 3, eye); put(16, 10 + hy, '#fff'); rect(17, 13 + hy, 2, 1, '#f58f8a'); }
  else { rect(8, 10 + hy, 2, 3, eye); rect(14, 10 + hy, 2, 3, eye); put(8, 10 + hy, '#fff'); put(14, 10 + hy, '#fff'); rect(6, 13 + hy, 2, 1, '#f58f8a'); rect(16, 13 + hy, 2, 1, '#f58f8a'); }
  if (o.beard) { const b = hexCss(o.beard); for (let y = 13; y <= 16; y++) for (let x = fx - 6; x <= fx + 6; x++) if (((x + .5 - fx) / 6.4) ** 2 + ((y + .5 - 10.5) / 6.2) ** 2 <= 1 && (y > 13 || x < fx - 4 || x > fx + 3) && !(side && x < fx - 2 && y < 15)) put(x, y + hy, b);
    rect(side ? 15 : 10, 14 + hy, side ? 3 : 4, 1, cheer ? '#fff' : '#f6dccb'); }
  else if (cheer) rect(side ? 15 : 11, 14 + hy, 2, 2, '#b4483f'); else rect(side ? 16 : 11, 14 + hy, 2, 1, '#b4483f');
}
const atlasCache = new Map();
function atlas(o) {
  const key = JSON.stringify(o); let t = atlasCache.get(key); if (t) return t;
  const cv = document.createElement('canvas'); cv.width = FW * NF; cv.height = FH; const cx = cv.getContext('2d');
  [['front', 0, 0], ['front', 1, 0], ['back', 0, 0], ['back', 1, 0], ['side', 0, 0], ['side', 1, 0], ['front', 0, 1]].forEach(([dir, step, cheer], f) => {
    const G = Array.from({ length: FH }, () => Array(FW).fill(null)); drawFrame(G, o, dir, step, cheer);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { let c = G[y][x];
      if (!c && ((G[y][x + 1]) || (G[y][x - 1]) || (G[y + 1] && G[y + 1][x]) || (G[y - 1] && G[y - 1][x]))) c = '#2a1a2c';     // 1px dark outline
      if (c) { cx.fillStyle = c; cx.fillRect(f * FW + x, y, 1, 1); } } });
  t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; t.userData.keep = true; atlasCache.set(key, t); return t;
}
export function makeChar(o = {}) {
  o = { skin: 0xe6b596, hair: 0x241a16, top: 0xff6a6a, legs: 0x3b4a8a, style: 'short', ...o };
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const map = atlas(o).clone(); map.needsUpdate = true; map.repeat.set(1 / NF, 1);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map, alphaTest: .5, fog: false })); sp.center.set(.5, 0); sp.scale.set(1.44, 1.8, 1); body.add(sp);
  const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.position.y = .03; g.add(sh);
  if (o.scale) g.scale.setScalar(o.scale);
  return { g, body, sp, sh, ph: Math.random() * 6, face: 0, y: 0, vy: 0, cheer: 0, hold: null,
    // speed 0..1 drives the two-frame walk; face picks front / back / side; y is jump height
    anim(dt, speed = 0) {
      this.ph += dt * (5 + speed * 7); const walking = speed > .05, step = walking && Math.sin(this.ph) > 0 ? 1 : 0;
      const f = Math.atan2(Math.sin(this.face), Math.cos(this.face)), af = Math.abs(f); let fr, flip = false;
      if (this.cheer > 0) { this.cheer -= dt; fr = 6; } else if (this.hold) fr = 0;
      else if (af < .9) fr = step; else if (af > 2.25) fr = 2 + step; else { fr = 4 + step; flip = f < 0; }
      map.repeat.x = (flip ? -1 : 1) / NF; map.offset.x = (flip ? fr + 1 : fr) / NF;
      body.position.y = this.y + (walking ? Math.abs(Math.sin(this.ph)) * .07 : Math.sin(this.ph * .4) * .012) + (this.cheer > 0 ? Math.abs(Math.sin(this.ph * 2)) * .12 : 0);
      sp.material.rotation = -body.rotation.z;
      sh.scale.setScalar(1 / (1 + this.y * .6));
    } };
}

/* what the two of them are holding in each level's polaroid */
export function prop(kind) {
  const g = new THREE.Group(), b = new Batch();
  const glass = (x) => { b.cyl(x, 0, 0, .05, .02, 0xffffff, 1, 6, 1.4); b.cyl(x, .02, 0, .012, .14, 0xffffff, 1, 5, 1.4); b.cyl(x, .16, 0, .012, .09, 0xffb3c4, 8, 8, 1.5); };
  if (kind === 'toast') { glass(-.09); glass(.09); }
  else if (kind === 'lantern') { b.ball(0, .12, 0, .13, 0xffd77e, 3); b.cyl(0, .23, 0, .05, .04, 0x3b3030, 1, 6); b.cyl(0, 0, 0, .07, .03, 0x3b3030, 1, 6); }
  else if (kind === 'croissant') { b.ball(-.1, .1, 0, .08, 0xd99a4a); b.ball(0, .14, 0, .1, 0xe0a85a); b.ball(.1, .1, 0, .08, 0xd99a4a);
    b.box(-.75, -1.05, -.75, .9, 1.25, .16, 0x2f8a80); b.box(.75, -1.05, -.75, .9, 1.25, .16, 0x2f8a80); b.box(-.75, .2, -.75, .9, .14, .2, 0x3aa598); b.box(.75, .2, -.75, .9, .14, .2, 0x3aa598); }
  else if (kind === 'frybread') { b.cyl(0, .06, 0, .17, .05, 0xe0b060, 1, 9); b.cyl(0, .02, 0, .2, .03, 0xf2efe6, 1, 9); }
  else if (kind === 'beignet') { b.box(-.07, .04, 0, .13, .1, .13, 0xfff6e6, .3); b.box(.08, .04, .02, .13, .1, .13, 0xfff6e6, -.2); b.box(0, .13, 0, .12, .09, .12, 0xffffff, .6);
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; b.ball(Math.cos(a) * .22, -.06 + Math.abs(Math.sin(a)) * -.12, Math.sin(a) * .05, .03, [0xb04ad9, 0x4fae6a, 0xffd27a][i % 3], 1.6); } }
  else if (kind === 'playbill') { b.box(0, 0, 0, .24, .32, .02, 0xffd23a); b.box(0, .24, .012, .24, .07, .01, 0x1c1a24); b.box(0, .05, .012, .16, .14, .01, 0xf2efe6); }
  else if (kind === 'cake') { b.cyl(0, 0, 0, .19, .14, 0xff9ab8, 1, 12); b.cyl(0, .14, 0, .2, .03, 0xfff6e6, 1, 12); for (const x of [-.08, 0, .08]) { b.cyl(x, .17, 0, .012, .09, 0x7ad7ff, 1, 5); b.ball(x, .29, 0, .028, 0xffd77e, 4); } }
  b.build(g); return g;
}

/* small roaming hazards for collect levels */
export function critter(kind) {
  const g = new THREE.Group(), b = new Batch();
  if (kind === 'gull') { b.ball(0, 1.3, 0, .26, 0xf4f4f0, 0, .8); b.ball(0, 1.42, .28, .16, 0xf4f4f0); b.cone(0, 1.36, .4, .06, .2, 0xffa53a, 4);
    b.box(-.5, 1.32, 0, .7, .05, .3, 0xd8dade, 0, 0, 0, .25); b.box(.5, 1.32, 0, .7, .05, .3, 0xd8dade, 0, 0, 0, -.25); b.box(0, 1.28, -.3, .2, .04, .3, 0x8a8f9a); }
  else { b.ball(0, 1, 0, .34, 0x7ad7ff, 3); b.ball(0, 1, -.4, .2, 0x7ad7ff, 2); b.ball(0, 1, -.7, .12, 0x7ad7ff, 1.4); }
  b.build(g); const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.position.y = .03; g.add(sh); return g;
}

/* ---------- sky dome + stars ---------- */
export function sky(top, mid, bot, stars = 0) {
  const g = new THREE.Group(); g.name = 'sky';
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { a: { value: new THREE.Color(top) }, b: { value: new THREE.Color(mid) }, c: { value: new THREE.Color(bot) } },
    vertexShader: 'varying float h; void main(){ h=normalize(position).y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'precision mediump float; uniform vec3 a,b,c; varying float h; void main(){ vec3 col=h>0.?mix(b,a,pow(h,.55)):mix(b,c,pow(-h,.5)); gl_FragColor=vec4(col,1.); }' });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(300, 16, 10), m));
  if (stars) { const p = new Float32Array(stars * 3);
    for (let i = 0; i < stars; i++) { const u = Math.random() * 6.283, v = Math.acos(Math.random() * 1.7 - .7), r = 250; p[i * 3] = r * Math.sin(v) * Math.cos(u); p[i * 3 + 1] = r * Math.cos(v); p[i * 3 + 2] = r * Math.sin(v) * Math.sin(u); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: .85 }))); }
  world.add(g); return g;
}
export function lights(skyCol, groundCol, hemi, sunCol, sun, x = 5, y = 10, z = 6) {
  const h = new THREE.HemisphereLight(skyCol, groundCol, hemi), d = new THREE.DirectionalLight(sunCol, sun); d.position.set(x, y, z).multiplyScalar(2);
  d.castShadow = true; d.shadow.mapSize.set(1024, 1024); const c = d.shadow.camera; c.left = -17; c.right = 17; c.top = 17; c.bottom = -17; c.near = 1; c.far = 60; d.shadow.bias = -.0012; d.shadow.radius = 4;
  world.add(h, d);
}
export function orb(x, y, z, r, col, k = 2.5) { // sun / moon
  const m = new THREE.Mesh(G.ball, new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), fog: false })); m.position.set(x, y, z); m.scale.setScalar(r); world.add(m); return m;
}

/* ---------- ambient particles (fireflies / rain / snow / petals) ---------- */
export function ambient({ n = 120, col = 0xffe9a0, size = .14, area = 14, h = 7, vy = 0, drift = .4, add = true, opacity = .9 }) {
  const p = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - .5) * area * 2; p[i * 3 + 1] = Math.random() * h; p[i * 3 + 2] = (Math.random() - .5) * area * 2; seed[i] = Math.random() * 6.28; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(col).multiplyScalar(add ? 2 : 1), size, transparent: true, opacity, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending }));
  pts.frustumCulled = false; world.add(pts);
  return { pts, update(dt, t) { for (let i = 0; i < n; i++) { const j = i * 3; p[j + 1] += vy * dt + Math.sin(t * .9 + seed[i]) * drift * dt * .5; p[j] += Math.cos(t * .6 + seed[i]) * drift * dt;
    if (p[j + 1] < 0) p[j + 1] += h; else if (p[j + 1] > h) p[j + 1] -= h; } g.attributes.position.needsUpdate = true; } };
}

/* ---------- pooled burst particles (pickups, confetti, fireworks) ---------- */
const N = 260, bGeo = keep(new THREE.TetrahedronGeometry(.11)), bMat = keep(new THREE.MeshBasicMaterial({ fog: false }));
const inst = new THREE.InstancedMesh(bGeo, bMat, N); inst.frustumCulled = false; inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
const P = []; for (let i = 0; i < N; i++) { P.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, g: 9 }); inst.setColorAt(i, _c.set(0xffffff)); }
let head = 0; scene.add(inst);
export const FX = {
  burst(x, y, z, cols, n = 14, speed = 4, grav = 9, life = .9, k = 2.2) {
    for (let i = 0; i < n; i++) { const p = P[head], a = Math.random() * 6.283, u = Math.random() * 2 - 1, r = Math.sqrt(1 - u * u), s = speed * (.4 + Math.random() * .6);
      p.x = x; p.y = y; p.z = z; p.vx = Math.cos(a) * r * s; p.vy = Math.abs(u) * s + 1; p.vz = Math.sin(a) * r * s; p.life = life * (.6 + Math.random() * .6); p.g = grav;
      inst.setColorAt(head, _c.set(Array.isArray(cols) ? cols[i % cols.length] : cols).multiplyScalar(k)); head = (head + 1) % N; }
    inst.instanceColor.needsUpdate = true;
  },
  confetti(x, y, z, n = 60) { this.burst(x, y, z, [0xffd77e, 0xff7ab6, 0x7ad7ff, 0x9bff9b, 0xffffff], n, 6, 5, 2.2, 1.6); },
  update(dt) { for (let i = 0; i < N; i++) { const p = P[i];
      if (p.life > 0) { p.life -= dt; p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; const s = Math.min(1, p.life * 3);
        _m.makeRotationY(p.life * 9).scale(_s.set(s, s, s)).setPosition(p.x, p.y, p.z); }
      else _m.makeScale(0, 0, 0);
      inst.setMatrixAt(i, _m); }
    inst.instanceMatrix.needsUpdate = true; },
};

/* ---------- instanced collectibles ---------- */
export function items(n, shape = 'coin', col = 0xffd77e, k = 2) {
  const geo = shape === 'heart' ? new THREE.OctahedronGeometry(.3) : shape === 'ball' ? new THREE.IcosahedronGeometry(.26, 1) : shape === 'box' ? new THREE.BoxGeometry(.42, .42, .42)
    : shape === 'ring' ? new THREE.TorusGeometry(.26, .08, 6, 12) : new THREE.CylinderGeometry(.3, .3, .1, 10).rotateX(Math.PI / 2);
  const m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ fog: false }), n); m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const cols = Array.isArray(col) ? col : [col];
  for (let i = 0; i < n; i++) m.setColorAt(i, _c.set(cols[i % cols.length]).multiplyScalar(k));
  world.add(m);
  return { m, set(i, x, y, z, s = 1, ry = 0) { _m.makeRotationY(ry).scale(_s.set(s, s, s)).setPosition(x, y, z); m.setMatrixAt(i, _m); }, color(i, c, kk = k) { m.setColorAt(i, _c.set(c).multiplyScalar(kk)); m.instanceColor.needsUpdate = true; }, flush() { m.instanceMatrix.needsUpdate = true; } };
}
