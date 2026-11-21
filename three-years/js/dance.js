// Three Years — the couples dance, used by every wedding.
// You dance WITH your partner, not beside them. One of you leads a move on the beat, the other answers it on the next
// strong beat, and then you both do it together. The lead swaps every few moves. Every fifth move is done together.
// No lanes, no falling notes: one bubble over the couple shows the move, and a ring closes on it as the beat arrives.
import { $, Input, Cam, UI, Sfx, Music, rumble, clamp } from './engine.js';
import { SONGS } from './songs.js';
import { FX } from './kit.js';

const MOVES = {
  LEFT: { icon: '◀', name: 'step', hz: 392 }, RIGHT: { icon: '▶', name: 'step', hz: 440 },
  UP: { icon: '↻', name: 'spin', hz: 523 }, DOWN: { icon: '⤵', name: 'dip', hz: 330 }, A: { icon: '★', name: 'jump', hz: 659 },
};
const HEARTS = 6, WIN = .26, LEADWIN = .34, GAP = .55;      // seconds either side of the beat that still counts; half the distance between the two dancers

export function dance(ctx) {
  const P = ctx.P, me = ctx.me, pal = ctx.pal, beat = 60 / P.bpm, step = P.step || 2, period = P.period || 4, allowed = P.moves || ['LEFT', 'RIGHT', 'UP', 'DOWN', 'A'];
  const at = P.at || [0, 0], names = ctx.names || { me: 'you', pal: 'partner' }, hostLeadsFirst = false;
  /* the whole dance, laid out up front so two phones agree on it: who leads each move, and which ones are done together */
  const ex = []; for (let k = 0, b = 6; (b + step + 1) * beat < P.time - 1; k++, b += period) {
    const block = Math.floor(k / 5), both = k % 5 === 4, hostLeads = (block % 2 === 0) === hostLeadsFirst;
    ex.push({ k, call: b * beat, ans: (b + step) * beat, both, mine: both ? false : (ctx.twoP ? hostLeads === ctx.isHost : block % 2 === 1), move: null, closed: false, told: false }); }
  let t0 = null, cur = 0, chem = 2, lastLead = null, done = false, gx = 0, th = 0, act = null, flashT = 0, flashCol = '', roleNow = '', bubNow = '';

  /* what you see: a line saying whose turn it is, and a bubble with the move and a ring closing on it */
  const hud = document.createElement('div');
  hud.style.cssText = 'position:absolute;left:0;right:0;top:13%;z-index:4;display:flex;flex-direction:column;align-items:center;gap:7px;pointer-events:none';
  hud.innerHTML = `<div class="dr" style="padding:3px 10px;border:2px solid #fff;border-radius:7px;box-shadow:0 0 0 2px #14143a;background:linear-gradient(#3a52c8,#1a2470);color:#fff;font:700 11px 'Courier New',monospace;letter-spacing:.06em;text-shadow:1px 1px 0 #14143a"></div>
    <div style="position:relative;width:58px;height:58px"><div class="rg" style="position:absolute;inset:0;border:3px solid #ffe27a;border-radius:50%;box-sizing:border-box"></div>
    <div class="bb" style="position:absolute;inset:5px;border-radius:50%;background:#fff;border:3px solid #2a1a2c;box-sizing:border-box;display:flex;align-items:center;justify-content:center;font:700 26px/1 'Courier New',monospace;color:#2a1a2c"></div></div>`;
  $('#screen').appendChild(hud);
  const elRole = hud.querySelector('.dr'), elRing = hud.querySelector('.rg'), elBub = hud.querySelector('.bb');
  const role = (t) => { if (t !== roleNow) { roleNow = t; elRole.textContent = t; } };
  const bubble = (t, col) => { const key = t + col; if (key !== bubNow) { bubNow = key; elBub.textContent = t; elBub.style.color = col; } };
  const flash = (col) => { flashT = .35; flashCol = col; };
  const hearts = () => UI.note('♥'.repeat(chem) + '♡'.repeat(HEARTS - chem) + '   ' + [...new Set(allowed.map((m) => (m === 'LEFT' || m === 'RIGHT' ? '◀▶ step' : `${m === 'UP' ? '▲' : m === 'DOWN' ? '▼' : 'A'} ${MOVES[m].name}`)))].join(' · '));
  const warm = (d) => { chem = clamp(chem + d, 0, HEARTS); hearts(); };
  hearts();

  /* the two of them. they hold a spot facing each other; a move carries both of them */
  const start = (m, who, lead) => { act = { m, who, lead, t: 0, dur: beat * (who === 'both' ? step * .95 : step * .8), gx0: gx, th0: th }; if (who === 'both' && m === 'A') me.cheer = pal.cheer = beat * step * .8; };
  const stumble = (who) => { act = { m: 'oops', who, lead: who, t: 0, dur: .5, gx0: gx, th0: th }; };
  const together = (m, lead) => { start(m, 'both', lead); Sfx.beep(MOVES[m].hz * 2, .12, 'triangle', .1); FX.burst(at[0] + gx, 1.6, at[1], 0xff7ab6, 6, 2, 3, .5, 1); };
  const pose = (dt, now) => {
    const bop = Math.abs(Math.sin(now / beat * Math.PI)) * .08, sway = Math.sin(now / beat * Math.PI / 2) * .1;
    let x = gx, a = th, ex2 = { me: [0, 0, 0, null], pal: [0, 0, 0, null] };      // per dancer: sideways lean, height, tilt, facing override
    if (act) { act.t += dt; const u = clamp(act.t / act.dur, 0, 1), e = u * u * (3 - 2 * u), s = Math.sin(u * Math.PI), dir = act.m === 'LEFT' ? -1 : 1, both = act.who === 'both';
      const L = act.lead, F = L === 'me' ? 'pal' : 'me';
      if (act.m === 'oops') ex2[act.who][2] = Math.sin(u * Math.PI * 5) * .28 * (1 - u);
      else if (act.m === 'LEFT' || act.m === 'RIGHT') { if (both) { x = clamp(act.gx0 + dir * 1.15 * e, -2.3, 2.3); ex2.me[1] = ex2.pal[1] = s * .22; } else ex2[L][0] = dir * .32 * s; }
      else if (act.m === 'UP') { if (both) { a = act.th0 + Math.PI * 2 * e; ex2.me[1] = ex2.pal[1] = s * .1; } else ex2[L][3] = e * Math.PI * 2; }
      else if (act.m === 'DOWN') { if (both) { ex2[F][2] = s * .95; ex2[F][1] = -s * .12; ex2[L][2] = -s * .22; } else ex2[L][2] = -s * .3; }
      else if (act.m === 'A') { if (both) ex2.me[1] = ex2.pal[1] = s * .8; else ex2[L][1] = s * .38; }
      if (u >= 1) { if (both) { gx = x; th = a % (Math.PI * 2); } act = null; } }
    const cx = at[0] + x + sway, cz = at[1], c = Math.cos(a), sn = Math.sin(a), mp = me.g.position, pp = pal.g.position;
    mp.set(cx - c * GAP + ex2.me[0], 0, cz - sn * GAP); pp.set(cx + c * GAP + ex2.pal[0], 0, cz + sn * GAP);
    const side = mp.x < pp.x ? 1 : -1;                                               // which way "away from your partner" is, for the dip
    me.face = Math.atan2(pp.x - mp.x, pp.z - mp.z) + (ex2.me[3] || 0); pal.face = Math.atan2(mp.x - pp.x, mp.z - pp.z) + (ex2.pal[3] || 0);
    me.y = bop + ex2.me[1]; pal.y = bop + ex2.pal[1]; me.body.rotation.z = -ex2.me[2] * side; pal.body.rotation.z = ex2.pal[2] * side;
    me.anim(dt, .25); pal.anim(dt, .25);
  };

  /* two phones: the leader says what they did, the follower says whether they kept up */
  ctx.on('call', ([k, m]) => { const e = ex[k]; if (!e || e.mine || e.both || e.move) return; if (!m) { e.move = 'none'; e.closed = true; UI.pop(`${names.pal} blanked`); return; }
    // the two phones' clocks are never exactly together: if the call landed late, answer one beat later, still on this phone's beat
    const now = Sfx.now() - t0, soonest = Math.ceil((now + beat * .9) / beat) * beat; e.move = m; e.told = false; e.ans = Math.min(Math.max(e.ans, soonest), e.call + beat * 3); });
  ctx.on('ans', ([k, ok]) => { const e = ex[k]; if (!e || e.heard) return; e.heard = true;
    if (e.both) { if (ok) pal.cheer = .6; return; }
    if (!e.mine || e.move == null || e.move === 'none') return; if (ok) { together(e.move, 'me'); warm(1); UI.pop('together!'); } else { stumble('pal'); UI.pop(`${names.pal} missed it`); } e.closed = true; });

  const api = {
    cam() { const v = P.cam; if (v) Cam.set(v[0] + gx * .4, v[1], v[2], v[3] + gx * .4, v[4], v[5]); else Cam.set(at[0] + gx * .5, 4.3, at[1] + 7.6, at[0] + gx * .5, 1.25, at[1]); },
    dispose() { hud.remove(); },
    update(dt) {
      // locked to the level's song: restart it on the first frame and read time off the audio clock
      if (t0 === null) { Music.play(SONGS[ctx.L.id], .7); t0 = Sfx.ctx ? Music.t0 : Sfx.now() + .7; }
      const now = Sfx.now() - t0, pressed = allowed.find((m) => Input.just.has(m)) || null;
      while (cur < ex.length && ex[cur].closed) cur++;
      const e = ex[cur]; let target = null;
      if (!e) { role('last dance'); bubble('♥', '#e5352f'); }
      else if (e.both) {                                                             // every fifth move: no leader, just the two of you
        target = e.ans; role('together · press A'); bubble('♥', '#e5352f');
        if (pressed === 'A' && Math.abs(now - e.ans) < WIN) { e.closed = true; const perfect = Math.abs(now - e.ans) < .1; ctx.add((perfect ? 3 : 2) + (chem >> 1), at[0] + gx, 1.4, at[1]); ctx.send('ans', [e.k, 1]);
          start('A', 'both', 'me'); FX.confetti(at[0] + gx, 2.4, at[1], 40); rumble(60, .3); UI.pop(perfect ? 'perfect, together!' : 'together!'); flash('#4fd67a'); if (!ctx.twoP) pal.cheer = .6; }
        else if (now > e.ans + WIN) { e.closed = true; UI.pop('...next time'); flash('#e5484d'); }
      } else if (e.mine) {                                                           // you lead: pick any move, on the beat
        if (e.move == null) { target = e.call; role('your lead · pick a move'); bubble('?', '#3a52c8');
          if (pressed && Math.abs(now - e.call) < LEADWIN) { const perfect = Math.abs(now - e.call) < .1, fresh = pressed !== lastLead; lastLead = e.move = pressed;
            ctx.add((perfect ? 2 : 1) + (fresh ? 1 : 0), at[0] + gx, 1.4, at[1]); ctx.send('call', [e.k, pressed]); start(pressed, 'me', 'me'); Sfx.beep(MOVES[pressed].hz, .12, 'square', .1);
            UI.pop(perfect ? (fresh ? 'smooth' : 'on the beat') : fresh ? 'nice' : 'again?'); flash('#4fd67a'); }
          else if (now > e.call + LEADWIN) { e.move = 'none'; e.closed = true; ctx.miss(); ctx.send('call', [e.k, 0]); UI.pop('lead!'); flash('#e5484d'); warm(-1); } }
        else { role(`${names.pal} follows`); bubble(MOVES[e.move].icon, '#3a52c8'); target = e.ans;
          if (!ctx.twoP && now >= e.ans) { e.closed = true; together(e.move, 'me'); warm(1); UI.pop('together!'); }
          else if (ctx.twoP && now > e.ans + beat * 1.3) e.closed = true; }
      } else {                                                                       // they lead: watch the move, then answer it on the next beat
        if (e.move == null) { role(`${names.pal} leads · watch`); bubble('…', '#e5352f');
          if (!ctx.twoP && now >= e.call) { let m; do { m = allowed[Math.floor(ctx.rnd() * allowed.length)]; } while (m === e.prev && allowed.length > 1); e.move = m; if (ex[cur + 1]) ex[cur + 1].prev = m; }
          else if (ctx.twoP && now > e.call + beat * 1.7) e.closed = true; }
        if (e.move && e.move !== 'none') { target = e.ans; role(`follow!  ${MOVES[e.move].icon} on the beat`); bubble(MOVES[e.move].icon, '#e5352f');
          if (!e.told) { e.told = true; start(e.move, 'pal', 'pal'); Sfx.beep(MOVES[e.move].hz, .12, 'square', .1); }
          if (pressed && Math.abs(now - e.ans) < WIN) { e.closed = true;
            if (pressed === e.move) { const perfect = Math.abs(now - e.ans) < .1; ctx.add(perfect ? 3 : 2, at[0] + gx, 1.4, at[1]); ctx.send('ans', [e.k, 1]); together(e.move, 'pal'); warm(1); UI.pop(perfect ? 'perfect!' : 'together!'); flash('#4fd67a'); }
            else { ctx.miss(); ctx.send('ans', [e.k, 0]); stumble('me'); warm(-1); Sfx.beep(140, .08, 'square', .06); UI.pop('other way!'); flash('#e5484d'); } }
          else if (now > e.ans + WIN) { e.closed = true; ctx.miss(); ctx.send('ans', [e.k, 0]); stumble('me'); warm(-1); UI.pop('too slow'); flash('#e5484d'); } }
      }
      // the ring closes on the bubble as the beat arrives
      flashT -= dt; const k = target == null ? 1 : clamp((target - now) / (beat * 2), 0, 1);
      elRing.style.transform = `scale(${(1 + k * 1.5).toFixed(3)})`; elRing.style.opacity = target == null ? '0' : String(1 - k * .55); elRing.style.borderColor = flashT > 0 ? flashCol : '#ffe27a'; elBub.style.borderColor = flashT > 0 ? flashCol : '#2a1a2c';
      pose(dt, now);
      UI.time(P.time - now); if (now >= P.time && !done) { done = true; hud.remove(); ctx.finish(); }
    },
  };
  ctx.onPhoto = () => { hud.remove(); me.y = pal.y = 0; me.body.rotation.z = pal.body.rotation.z = 0; };
  return api;
}
