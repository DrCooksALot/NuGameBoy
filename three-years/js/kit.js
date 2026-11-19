// Low-poly building kit: merged static batches, characters, sky, particles.
import { THREE, world, scene, clamp } from './engine.js';

const keep = (x) => { x.userData.keep = true; return x; };
const G = {
  box: keep(new THREE.BoxGeometry(1, 1, 1).toNonIndexed()),
  ball: keep(new THREE.IcosahedronGeometry(1, 1)),
  cyl: new Map(),
  getCyl(top, segs) { const k = top.toFixed(2) + ':' + segs; let g = this.cyl.get(k); if (!g) { g = keep(new THREE.CylinderGeometry(top, 1, 1, segs).toNonIndexed()); this.cyl.set(k, g); } return g; },
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
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })); m.matrixAutoUpdate = false; out.add(m); }
    if (this.gp.length) { const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.gp, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.gc, 3));
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })); m.matrixAutoUpdate = false; out.add(m); }
    this.p = this.n = this.c = this.gp = this.gc = null;
    parent.add(out); return out;
  }
}

/* ---------- props ---------- */
export function island(b, R, top = 0x4f8a5b, side = 0x5b4a3e, thick = .7) {
  b.cyl(0, -thick, 0, R, thick, top, 1, 20);
  b.cyl(0, -thick - R * .75, 0, R * .18, R * .75, side, 5.2, 9);
  b.cyl(R * .3, -thick - R * .95, -R * .2, R * .08, R * .5, side, 3, 6);
}
export function tree(b, x, z, s = 1, col = 0x2f6b46) { b.cyl(x, 0, z, .14 * s, .9 * s, 0x4a3323, .7, 6); b.ball(x, 1.5 * s, z, .8 * s, col, 0, 1.1); b.ball(x + .3 * s, 1.95 * s, z + .1, .5 * s, col); }
export function pine(b, x, z, s = 1, col = 0x24543a) { b.cyl(x, 0, z, .12 * s, .5 * s, 0x4a3323, 1, 6); b.cone(x, .4 * s, z, .8 * s, 1.1 * s, col); b.cone(x, 1.05 * s, z, .6 * s, 1 * s, col); b.cone(x, 1.7 * s, z, .38 * s, .8 * s, col); }
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

/* ---------- characters ---------- */
const limbGeo = keep(new THREE.BoxGeometry(.17, .46, .19).translate(0, -.23, 0));
const shadowGeo = keep(new THREE.CircleGeometry(.42, 14).rotateX(-Math.PI / 2));
const shadowMat = keep(new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .28, depthWrite: false }));
const lam = new Map();
const mat = (c) => { let m = lam.get(c); if (!m) { m = keep(new THREE.MeshLambertMaterial({ color: c, flatShading: true })); lam.set(c, m); } return m; };

export function makeChar(o = {}) {
  const { skin = 0xd9a577, hair = 0x241a16, top = 0xff6a6a, legs = 0x3b4a8a, style = 'short', scale = 1 } = o;
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const b = new Batch();
  b.cyl(0, .46, 0, .27, .52, top, .78, 8);                       // torso
  b.ball(0, 1.26, 0, .28, skin);                                // head
  b.ball(0, 1.34, -.03, .3, hair, 0, .82);                      // hair cap
  if (style === 'long') { b.box(0, .78, -.2, .5, .56, .16, hair); b.box(-.25, .95, -.05, .1, .34, .2, hair); b.box(.25, .95, -.05, .1, .34, .2, hair); }
  if (style === 'bun') b.ball(0, 1.66, -.1, .13, hair);
  if (style === 'curly') { const h2 = o.hair2 || hair;
    for (let i = 0; i < 11; i++) { const an = i / 11 * 6.283, f = Math.max(0, Math.cos(an)); b.ball(Math.sin(an) * .31, 1.32 + Math.cos(i * 2.4) * .06 + f * .24, -.06 + Math.cos(an) * (.24 - f * .12), .17 - f * .03, i % 3 ? hair : h2); }
    for (const sx of [-1, 1]) { b.ball(sx * .34, 1.08, -.04, .17, hair); b.ball(sx * .3, .9, -.1, .14, h2); }
    b.ball(0, 1.02, -.3, .24, hair); b.ball(0, 1.6, -.02, .2, h2); b.ball(-.14, 1.56, .14, .13, hair); b.ball(.15, 1.55, .13, .13, h2); }
  if (style === 'short') b.box(0, 1.44, .12, .44, .1, .2, hair, 0, 0, -.25);
  if (o.tie) { b.box(0, .62, .2, .16, .34, .08, 0xf2efe6); b.box(0, .64, .24, .06, .28, .04, o.tie); }
  if (o.dots) for (let i = 0; i < 9; i++) { const an = i * 2.4; b.ball(Math.sin(an) * .25, .52 + (i % 4) * .11, Math.cos(an) * .25, .05, i % 2 ? o.dots : 0x8fbf7a); }
  if (o.beard) { b.ball(0, 1.07, .08, .2, o.beard, 0, .5); b.box(-.2, 1.1, .1, .06, .2, .2, o.beard); b.box(.2, 1.1, .1, .06, .2, .2, o.beard); b.box(0, 1.185, .255, .16, .03, .03, o.beard); }
  if (o.cap) { b.ball(0, 1.42, -.02, .31, o.cap, 0, .55); b.box(0, 1.4, .26, .36, .04, .24, o.cap); }
  b.ball(-.1, 1.29, .255, .042, 0x1a1420); b.ball(.1, 1.29, .255, .042, 0x1a1420);
  b.box(0, 1.13, .262, .12, .028, .03, o.beard ? 0xf2d8cc : 0xa8483f); b.ball(-.16, 1.19, .21, .05, 0xf08a7a); b.ball(.16, 1.19, .21, .05, 0xf08a7a);
  b.build(body);
  const L = [], A = [];
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(limbGeo, mat(legs)); leg.position.set(sx * .13, .47, 0); body.add(leg); L.push(leg);
    const arm = new THREE.Mesh(limbGeo, mat(top)); arm.position.set(sx * .33, .96, 0); arm.scale.set(.8, .95, .8); body.add(arm); A.push(arm);
  }
  const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.position.y = .03; sh.renderOrder = 1; g.add(sh);
  g.scale.setScalar(scale);
  const ch = { g, body, L, A, sh, ph: Math.random() * 6, face: 0, y: 0, vy: 0, cheer: 0, hold: null,
    // speed 0..1 drives the walk cycle; ch.y is the jump height
    anim(dt, speed = 0) {
      this.ph += dt * (4 + speed * 9); const sw = Math.sin(this.ph) * .9 * clamp(speed, 0, 1);
      L[0].rotation.x = sw; L[1].rotation.x = -sw;
      if (this.hold) { for (let i = 0; i < 2; i++) { A[i].rotation.x = this.hold[i][0]; A[i].rotation.z = this.hold[i][1]; } }
      else if (this.cheer > 0) { this.cheer -= dt; A[0].rotation.z = -2.6; A[1].rotation.z = 2.6; A[0].rotation.x = A[1].rotation.x = 0; }
      else { A[0].rotation.z = A[1].rotation.z = 0; A[0].rotation.x = -sw; A[1].rotation.x = sw; }
      body.position.y = this.y + Math.abs(Math.sin(this.ph)) * .05 * (speed > .05 ? 1.6 : .5);
      let d = this.face - body.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); body.rotation.y += d * Math.min(1, dt * 12);
      sh.scale.setScalar(1 / (1 + this.y * .6));
    } };
  return ch;
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
  const h = new THREE.HemisphereLight(skyCol, groundCol, hemi), d = new THREE.DirectionalLight(sunCol, sun); d.position.set(x, y, z); world.add(h, d);
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
