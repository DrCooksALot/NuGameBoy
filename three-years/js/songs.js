// One happy, major-key chiptune per level. Tunes are generated from a seed + rhythm motifs so each level
// has its own melody, tempo and key; the ending plays "Happy Birthday to You" (public domain).
import { rng } from './engine.js';

function tune(seed, beats, chords, motifs) {
  const r = rng(seed), per = beats * 2, lead = []; let prev = 4;
  chords.forEach((ch, bar) => { const m = motifs[(bar >> 1) % motifs.length], last = bar === chords.length - 1;
    for (let k = 0; k < per; k++) { const c = m[k % m.length];
      if (c !== 'x') { lead.push(c === '-' ? '-' : null); continue; }
      let n;
      if (k % 4 === 0) { let best = 99; for (const t of [0, 2, 4]) for (const o of [-7, 0, 7]) { const v = ((ch + t) % 7) + o; if (v < 0 || v > 9) continue; const d = Math.abs(v - prev) + r() * .9; if (d < best) { best = d; n = v; } } }   // strong beats land on a chord tone
      else n = Math.max(0, Math.min(9, prev + (r() < .5 ? 1 : -1) * (r() < .25 ? 2 : 1)));                                                                                                                                  // weak beats step through the scale
      if (last && k >= per - 4) n = k === per - 4 ? 4 : 7;
      lead.push(n); prev = n; } });
  return lead;
}
const song = (seed, bpm, root, chords, motifs, o = {}) => ({ bpm, root, beats: 4, chords, lead: tune(seed, 4, chords, motifs), ...o });

export const SONGS = {
  title:      song(11, 92, 60, [0, 5, 3, 4, 0, 5, 3, 4], ['x-x-x---', 'x-x-x-x-'], { wave: 'triangle', drums: 'none' }),
  lightscape: song(23, 104, 64, [0, 3, 5, 4, 0, 3, 4, 0], ['x.x.x.xx', 'x-x.x---'], { wave: 'triangle' }),
  jitney:     song(37, 132, 67, [0, 3, 4, 3, 0, 3, 4, 0], ['xxx.xxx.', 'x.xxx-x.'], { drums: 'drive' }),
  metah:      song(41, 112, 65, [0, 4, 5, 3, 0, 4, 3, 4], ['x-xx-xx.', 'x.x.x-x-']),
  powwow:     song(53, 120, 62, [0, 3, 0, 4, 0, 3, 4, 0], ['xx.xx.x.', 'x-x-xx--']),
  wedding:    song(67, 112, 69, [0, 5, 3, 4, 0, 5, 3, 4], ['x.xx.x.x', 'xx.x.xx.'], { drums: 'drive' }),
  nola:       song(71, 126, 58, [0, 5, 1, 4, 0, 5, 1, 4], ['x.xx.xx.', 'x-.x.x--'], { swing: .33 }),
  godot:      song(83, 140, 57, [0, 3, 4, 0, 5, 3, 4, 0], ['xxxx.x.x', 'x.x.xxx-'], { drums: 'drive' }),
  birthday:   song(97, 118, 60, [0, 0, 3, 3, 4, 4, 0, 0], ['x.x.xx.x', 'xx-x.x--']),
  hbd: { bpm: 104, root: 60, beats: 3, wave: 'square', chords: [0, 4, 4, 0, 0, 3, 0, 0], lead: [
    -2, '-', -3, '-', 0, '-',   -1, '-', '-', '-', -3, -3,   -2, '-', -3, '-', 1, '-',   0, '-', '-', '-', -3, -3,
    4, '-', 2, '-', 0, '-',     -1, '-', -2, '-', 3, 3,      2, '-', 0, '-', 1, '-',     0, '-', '-', '-', -3, -3] },
};
