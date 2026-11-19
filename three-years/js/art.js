// Hand-drawn (well, code-drawn) illustrations of real moments. No photographs anywhere in the game.
// Each scene is a 400x300 SVG string; art(id) returns a data: URL usable as an <img src>.
const SKIN_H = '#e6b596', SKIN_A = '#e0a886', HAIR_H = '#1e1a18', BEARD = '#3a2c25', HAIR_A = '#7a3f24', HAIR_A2 = '#a65a2e';
const c = (x, y, r, f, o = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${o}/>`;
const face = (x, y, s, tilt = 0) => `<g transform="rotate(${tilt} ${x} ${y})">${c(x - 13 * s, y - 2 * s, 2.6 * s, '#2a1c18')}${c(x + 13 * s, y - 2 * s, 2.6 * s, '#2a1c18')}
  <path d="M${x - 11 * s} ${y + 14 * s} q${11 * s} ${9 * s} ${22 * s} 0" stroke="#7a3a30" stroke-width="${2.4 * s}" fill="none" stroke-linecap="round"/>
  ${c(x - 22 * s, y + 9 * s, 6 * s, '#f08a7a', 'opacity=".35"')}${c(x + 22 * s, y + 9 * s, 6 * s, '#f08a7a', 'opacity=".35"')}</g>`;

// him: short dark hair, beard, optional cap. (x,y) = centre of head, s = scale
function him(x, y, s, { top = '#2b2b30', cap = null, tilt = 0, collar = null } = {}) {
  return `<g><path d="M${x - 78 * s} ${y + 150 * s} q0 -${84 * s} ${78 * s} -${84 * s} q${78 * s} 0 ${78 * s} ${84 * s} z" fill="${top}"/>
  ${collar ? `<path d="M${x - 16 * s} ${y + 66 * s} l${16 * s} ${30 * s} l${16 * s} -${30 * s} z" fill="${collar}"/>` : ''}
  <rect x="${x - 13 * s}" y="${y + 30 * s}" width="${26 * s}" height="${34 * s}" rx="${10 * s}" fill="${SKIN_H}"/>
  <g transform="rotate(${tilt} ${x} ${y})">${c(x, y, 40 * s, SKIN_H)}
  <path d="M${x - 39 * s} ${y + 6 * s} q${4 * s} ${44 * s} ${39 * s} ${44 * s} q${35 * s} 0 ${39 * s} -${44 * s} q-${14 * s} ${20 * s} -${39 * s} ${20 * s} q-${25 * s} 0 -${39 * s} -${20 * s} z" fill="${BEARD}" opacity=".9"/>
  <path d="M${x - 40 * s} ${y - 6 * s} q-${2 * s} -${38 * s} ${40 * s} -${38 * s} q${42 * s} 0 ${40 * s} ${38 * s} q-${10 * s} -${18 * s} -${40 * s} -${18 * s} q-${30 * s} 0 -${40 * s} ${18 * s} z" fill="${HAIR_H}"/>
  ${cap ? `<path d="M${x - 42 * s} ${y - 12 * s} q0 -${36 * s} ${42 * s} -${36 * s} q${42 * s} 0 ${42 * s} ${36 * s} z" fill="${cap}"/><path d="M${x - 44 * s} ${y - 14 * s} q${50 * s} -${12 * s} ${96 * s} ${4 * s} l-${6 * s} ${8 * s} q-${40 * s} -${10 * s} -${90 * s} 0 z" fill="${cap}"/>` : ''}
  </g>${face(x, y + 2 * s, s, tilt)}</g>`;
}
// her: big auburn curls (or straight with bangs), (x,y) = centre of head
function her(x, y, s, { top = '#7a2238', bangs = false, tilt = 0, glow = false, shoulders = false } = {}) {
  const h1 = glow ? '#b5622c' : HAIR_A, h2 = glow ? '#e08a3c' : HAIR_A2; let curls = '';
  if (!bangs) for (let i = 0; i < 16; i++) { const a = -Math.PI * 1.12 + i / 15 * Math.PI * 1.24 * 2 * .56, r = 46 * s; curls += c(x + Math.cos(a) * r, y - 4 * s + Math.sin(a) * r, (15 + (i * 7 % 5)) * s, i % 3 ? h1 : h2); }
  return `<g><path d="M${x - 74 * s} ${y + 150 * s} q0 -${80 * s} ${74 * s} -${80 * s} q${74 * s} 0 ${74 * s} ${80 * s} z" fill="${top}"/>
  ${shoulders ? `<path d="M${x - 60 * s} ${y + 84 * s} q${60 * s} -${26 * s} ${120 * s} 0 q-${60 * s} -${4 * s} -${120 * s} 0 z" fill="${SKIN_A}"/>` : ''}
  <rect x="${x - 12 * s}" y="${y + 30 * s}" width="${24 * s}" height="${34 * s}" rx="${10 * s}" fill="${SKIN_A}"/>
  <g transform="rotate(${tilt} ${x} ${y})">${bangs ? `<path d="M${x - 50 * s} ${y + 40 * s} q-${8 * s} -${88 * s} ${50 * s} -${88 * s} q${58 * s} 0 ${50 * s} ${88 * s} z" fill="${HAIR_A}"/>` : c(x, y - 6 * s, 50 * s, h1) + curls}
  ${c(x, y, 38 * s, SKIN_A)}
  ${bangs ? `<path d="M${x - 39 * s} ${y - 4 * s} q${4 * s} -${36 * s} ${39 * s} -${36 * s} q${35 * s} 0 ${39 * s} ${36 * s} q-${20 * s} ${6 * s} -${39 * s} ${2 * s} q-${19 * s} ${4 * s} -${39 * s} -${2 * s} z" fill="${HAIR_A}"/>`
    : c(x - 24 * s, y - 30 * s, 14 * s, h2) + c(x, y - 38 * s, 15 * s, h1) + c(x + 24 * s, y - 30 * s, 14 * s, h2)}
  </g>${face(x, y + 4 * s, s, tilt)}</g>`;
}
const grain = `<filter id="g"><feTurbulence baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .07 0"/></filter><rect width="400" height="300" filter="url(#g)"/>`;
const wrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${inner}${grain}</svg>`;

export const SCENES = {
  toast: { caption: 'dressed up, glass up', svg: () => wrap(`
    <defs><linearGradient id="s1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6e0"/><stop offset="1" stop-color="#ffe2c0"/></linearGradient></defs>
    <rect width="400" height="300" fill="url(#s1)"/>${c(330, 40, 90, '#ffffff', 'opacity=".7"')}
    ${[[30, 150, 60], [90, 120, 50], [320, 140, 64], [380, 110, 50], [210, 100, 40]].map(([x, y, r]) => c(x, y, r, '#8fbf7a', 'opacity=".75"')).join('')}
    ${[[60, 110], [340, 96], [300, 150], [24, 180]].map(([x, y]) => c(x, y, 9, '#ff9ab8')).join('')}
    ${him(128, 150, 1.05, { top: '#2a2a33', collar: '#c9b6e6', tilt: 6 })}
    ${her(286, 166, 1.02, { top: '#f2c9c2', tilt: -5, shoulders: true })}
    ${[[250, 262], [300, 276], [326, 250], [270, 290], [232, 284]].map(([x, y], i) => c(x, y, 7, i % 2 ? '#d9628a' : '#8fbf7a')).join('')}
    <path d="M176 196 q32 26 64 0 z" fill="#ffc9c4" stroke="#fff" stroke-width="3"/><path d="M208 209 v46 M190 257 h36" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    <path d="M148 262 q30 -30 56 -18" stroke="${SKIN_H}" stroke-width="20" stroke-linecap="round" fill="none"/>`) },

  sushi: { caption: 'one boat, two captains', svg: () => wrap(`
    <rect width="400" height="300" fill="#2b2a22"/><rect y="0" width="400" height="74" fill="#e9e6da"/><rect y="64" width="400" height="16" fill="#58f08a"/>
    <rect y="60" width="400" height="60" fill="#58f08a" opacity=".22"/>
    ${[40, 120, 200, 280, 360].map((x) => `<rect x="${x - 12}" y="46" width="24" height="20" rx="3" fill="#6b4a36"/><path d="M${x} 48 q-14 -30 -4 -42 M${x} 48 q0 -34 2 -44 M${x} 48 q14 -28 8 -40" stroke="#2f8a4a" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}
    <rect y="96" width="400" height="120" fill="#4a4636"/><rect y="96" width="400" height="10" fill="#5a5644"/>
    ${him(112, 150, .98, { top: '#8d8f96', cap: '#1c1c20', tilt: 8 })}${her(292, 148, .96, { top: '#1f1d22', tilt: -4 })}
    <rect y="236" width="400" height="64" fill="#8a7566"/><rect y="236" width="400" height="6" fill="#a08a78"/>
    <path d="M120 262 q90 34 190 0 l-14 -12 h-160 z" fill="#c98a4a"/><path d="M120 262 q-10 -22 16 -28 l4 16 z M310 262 q14 -18 -6 -30 l-8 18 z" fill="#b5763a"/>
    ${[150, 172, 194, 216, 238, 260, 282].map((x, i) => `<rect x="${x - 9}" y="${238 - (i % 2) * 5}" width="18" height="13" rx="5" fill="${['#ff8a6a', '#fff3e0', '#6fbf6a', '#ff6a8a', '#ffd27a'][i % 5]}"/>`).join('')}
    <path d="M52 216 l8 46 h20 l8 -46 z" fill="#ff6a5a"/><path d="M52 216 h36" stroke="#fff" stroke-width="3"/><path d="M56 232 l28 0 l-4 28 h-20 z" fill="#ffb347" opacity=".9"/>`) },

  train: { caption: 'the 5:41 out east', svg: () => wrap(`
    <rect width="400" height="300" fill="#b9b6ae"/><rect width="60" height="150" fill="#f4f6f2"/><rect x="60" width="10" height="160" fill="#8f8c86"/>
    <path d="M190 40 l210 -30 v26 l-200 30 z" fill="#d9d6ce"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M${214 + i * 40} ${40 - i * 6} l10 28" stroke="#a8a59c" stroke-width="5"/>`).join('')}
    <path d="M0 150 h150 q20 0 20 20 v130 h-170 z M230 150 h170 v150 h-190 v-130 q0 -20 20 -20 z" fill="#2f8a80"/><path d="M0 150 h150 q20 0 20 20 v10 h-170 z M230 150 h170 v30 h-190 v-10 q0 -20 20 -20 z" fill="#3aa598"/>
    ${him(150, 128, 1.12, { top: '#26241f', tilt: 10 })}
    ${her(262, 196, 1.02, { top: '#7a2238', bangs: true, tilt: -16 })}
    <path d="M196 300 q20 -70 90 -62 q84 -6 114 50 v12 z" fill="#7a2238"/>${[[230, 262], [262, 250], [300, 248], [336, 262], [366, 282], [212, 286], [282, 274], [322, 286]].map(([x, y]) => c(x, y, 16, '#8f2a44', 'opacity=".8"')).join('')}
    <path d="M300 232 q-22 -4 -36 -16" stroke="#1c1a1c" stroke-width="30" stroke-linecap="round" fill="none"/><ellipse cx="262" cy="216" rx="17" ry="13" fill="${SKIN_A}"/>${c(254, 212, 5, '#cfd6d8')}`) },

  voted: { caption: 'golden hour, civic duty', svg: () => wrap(`
    <defs><linearGradient id="s4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fc4e8"/><stop offset=".55" stop-color="#ffd9a0"/><stop offset="1" stop-color="#ffb870"/></linearGradient></defs>
    <rect width="400" height="300" fill="url(#s4)"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<path d="M${-10 + i * 50} 150 l28 -${80 + (i * 37 % 40)} l28 ${80 + (i * 37 % 40)} z" fill="${i % 2 ? '#3f6a4a' : '#4f7f52'}"/>`).join('')}
    <rect y="146" width="400" height="154" fill="#6a6a72"/><rect y="146" width="400" height="8" fill="#c9a36a"/>
    <rect x="296" y="156" width="74" height="30" rx="8" fill="#e9e4da"/><rect x="306" y="146" width="50" height="16" rx="6" fill="#cfd8e0"/>${c(312, 188, 8, '#222')}${c(356, 188, 8, '#222')}
    <rect x="20" y="158" width="60" height="26" rx="8" fill="#3d5a9a"/>${c(34, 186, 7, '#222')}${c(68, 186, 7, '#222')}
    ${him(140, 150, 1.05, { top: '#1f1e22', cap: '#17171a', tilt: -4 })}
    ${her(290, 190, 1.08, { top: '#2a2630', glow: true, tilt: 5 })}
    <path d="M120 290 q0 -40 44 -52" stroke="#1f1e22" stroke-width="26" stroke-linecap="round" fill="none"/>${c(170, 234, 15, SKIN_H)}
    ${c(184, 222, 15, '#fff')}<path d="M175 222 h18" stroke="#d9343a" stroke-width="5"/><path d="M177 215 h14 M177 229 h14" stroke="#3d5a9a" stroke-width="3"/>
    <rect width="400" height="300" fill="#ffb060" opacity=".14"/>`) },
};
export const art = (id) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(SCENES[id].svg());
