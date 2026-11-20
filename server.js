#!/usr/bin/env node
// NuGameBoy local / self-hosted server. No dependencies: `node server.js`
//
//  • serves the games as static files
//  • relays two-player messages over WebSockets at /ty-ws, so multiplayer needs no WebRTC and no third-party service
//
// Run it on your computer and open the printed address on both phones (same Wi-Fi), or deploy it anywhere that runs Node
// (Render, Railway, Fly, a VPS). It listens on $PORT, default 8080.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');

const ROOT = __dirname, PORT = Number(process.env.PORT) || 8080;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8' };

/* ---------- static files ---------- */
const server = http.createServer((req, res) => {
  let rel; try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); return res.end('bad request'); }
  if (rel === '/healthz') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('ok'); }
  if (rel === '/favicon.ico') { res.writeHead(204); return res.end(); }
  let file = path.normalize(path.join(ROOT, rel));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end('forbidden'); }       // no escaping the game folder
  if (path.basename(file).startsWith('.') || /(^|[\\/])(node_modules|\.git)([\\/]|$)/.test(path.relative(ROOT, file))) { res.writeHead(404); return res.end('not found'); }
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) { if (!rel.endsWith('/')) { res.writeHead(301, { location: rel + '/' }); return res.end(); } file = path.join(file, 'index.html'); }
    fs.stat(file, (err2, st2) => {
      if (err2 || !st2.isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('not found'); }
      const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      const head = { 'content-type': type, 'cache-control': 'no-cache', 'accept-ranges': 'bytes' };
      if (range && (range[1] || range[2])) {                                                                          // byte ranges, which Safari needs to play audio
        const start = range[1] ? Number(range[1]) : Math.max(0, st2.size - Number(range[2])), end = range[1] && range[2] ? Math.min(Number(range[2]), st2.size - 1) : st2.size - 1;
        if (start > end || start >= st2.size) { res.writeHead(416, { 'content-range': `bytes */${st2.size}` }); return res.end(); }
        res.writeHead(206, { ...head, 'content-range': `bytes ${start}-${end}/${st2.size}`, 'content-length': end - start + 1 });
        return req.method === 'HEAD' ? res.end() : fs.createReadStream(file, { start, end }).pipe(res);
      }
      res.writeHead(200, { ...head, 'content-length': st2.size });
      req.method === 'HEAD' ? res.end() : fs.createReadStream(file).pipe(res);
    });
  });
});

/* ---------- two-player relay: a room is a 4-character code holding one host and one guest ---------- */
const rooms = new Map();
const frame = (text) => { const body = Buffer.from(text), n = body.length;
  const head = n < 126 ? Buffer.from([0x81, n]) : n < 65536 ? Buffer.from([0x81, 126, n >> 8, n & 255]) : Buffer.concat([Buffer.from([0x81, 127, 0, 0, 0, 0]), Buffer.from([n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255])]);
  return Buffer.concat([head, body]); };
const send = (sock, obj) => { if (sock && !sock.destroyed) try { sock.write(frame(typeof obj === 'string' ? obj : JSON.stringify(obj))); } catch (e) {} };

server.on('upgrade', (req, sock) => {
  const url = new URL(req.url, 'http://x'), key = req.headers['sec-websocket-key'];
  const code = String(url.searchParams.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8), role = url.searchParams.get('role') === 'host' ? 'host' : 'guest';
  if (url.pathname !== '/ty-ws' || !key || code.length < 4) { sock.end('HTTP/1.1 400 Bad Request\r\n\r\n'); return; }
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' +
    crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64') + '\r\n\r\n');
  sock.setNoDelay(true);

  let room = rooms.get(code);
  if (role === 'host') { if (room && room.host) send(room.host, { t: '_bye' }); room = { host: sock, guest: room ? room.guest : null }; rooms.set(code, room); }
  else if (!room || !room.host) { send(sock, { t: '_noroom' }); return sock.end(); }
  else { if (room.guest) { send(room.guest, { t: '_bye' }); room.guest.end(); } room.guest = sock; }
  const other = () => { const r = rooms.get(code); return r ? (role === 'host' ? r.guest : r.host) : null; };
  if (room.host && room.guest) { send(room.host, { t: '_ok' }); send(room.guest, { t: '_ok' }); }

  let buf = Buffer.alloc(0), parts = [];
  sock.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    for (;;) {                                                                                                        // parse as many whole frames as have arrived
      if (buf.length < 2) return;
      const fin = buf[0] & 0x80, op = buf[0] & 0x0f, masked = buf[1] & 0x80; let len = buf[1] & 0x7f, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      if (len > 1 << 20) return sock.destroy();                                                                       // nothing in this game is anywhere near 1 MB
      const need = off + (masked ? 4 : 0) + len; if (buf.length < need) return;
      const payload = Buffer.from(buf.subarray(off + (masked ? 4 : 0), need));
      if (masked) { const mask = buf.subarray(off, off + 4); for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3]; }
      buf = buf.subarray(need);
      if (op === 0x8) return sock.end();                                                                              // close
      if (op === 0x9) { sock.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload])); continue; }        // ping -> pong
      if (op === 0xa) continue;                                                                                       // pong
      parts.push(payload); if (!fin) continue;
      const text = Buffer.concat(parts).toString('utf8'); parts = [];
      send(other(), text);                                                                                            // the whole job: pass it to the other player
    }
  });
  const gone = () => { const r = rooms.get(code); if (!r) return; const o = other();
    if (role === 'host' && r.host === sock) r.host = null; else if (role === 'guest' && r.guest === sock) r.guest = null; else return;
    send(o, { t: '_bye' }); if (!r.host && !r.guest) rooms.delete(code); };
  sock.on('close', gone); sock.on('error', gone);
});
setInterval(() => { for (const r of rooms.values()) for (const s of [r.host, r.guest]) if (s && !s.destroyed) try { s.write(Buffer.from([0x89, 0])); } catch (e) {} }, 25000).unref();   // keep idle connections alive

server.listen(PORT, '0.0.0.0', () => {
  const lan = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
  console.log('\n  NuGameBoy is running\n');
  console.log(`  on this computer:   http://localhost:${PORT}/three-years/`);
  for (const ip of lan) console.log(`  on your phones:     http://${ip}:${PORT}/three-years/     (same Wi-Fi)`);
  console.log('\n  Two player works through this server: TWO PLAYER → HOST on one phone, JOIN on the other.\n  Ctrl+C to stop.\n');
});
