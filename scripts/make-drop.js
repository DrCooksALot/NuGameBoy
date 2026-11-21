#!/usr/bin/env node
// Builds ./netlify-drop: a folder you can drag onto https://app.netlify.com/drop
// Static files only. Two player on Netlify goes through the public broker relay (no server needed).
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'netlify-drop');
const INCLUDE = ['index.html', 'gameboy_game_v2.html', 'Tickets.png', 'assets', 'three-years'];
const SKIP = /(^|[\\/])(\.DS_Store|README\.md|photos)$/;

fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
let files = 0, bytes = 0;
const copy = (from, to) => { if (SKIP.test(from)) return; const st = fs.statSync(from);
  if (st.isDirectory()) { fs.mkdirSync(to, { recursive: true }); for (const f of fs.readdirSync(from)) copy(path.join(from, f), path.join(to, f)); }
  else { fs.copyFileSync(from, to); files++; bytes += st.size; } };
for (const f of INCLUDE) if (fs.existsSync(path.join(ROOT, f))) copy(path.join(ROOT, f), path.join(OUT, f));

// always fetch fresh game code (so a fix reaches her phone on the next load); the vendored libraries never change
fs.writeFileSync(path.join(OUT, '_headers'), '/*\n  Cache-Control: no-cache\n\n/three-years/vendor/*\n  Cache-Control: public, max-age=31536000, immutable\n');
// the site address opens the birthday game directly; the cartridge menu stays at /index.html
fs.writeFileSync(path.join(OUT, '_redirects'), '/  /three-years/  302!\n');
console.log(`netlify-drop/ ready: ${files} files, ${(bytes / 1048576).toFixed(1)} MB\nDrag that folder onto https://app.netlify.com/drop`);
