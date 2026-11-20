# NuGameBoy

A handheld-style shell with cartridges. The main one is **Three Years** (`three-years/`).

## Run it locally

Needs [Node.js](https://nodejs.org) 18 or newer. Nothing to install.

```bash
node server.js
```

It prints two addresses: one for this computer, and one like `http://192.168.x.x:8080/three-years/` to open on your phones (same Wi-Fi).

`server.js` does two jobs:

- serves the game files
- relays two-player messages itself over WebSockets (`/ty-ws`), so multiplayer needs no WebRTC and no outside service

When the game is opened from `server.js`, TWO PLAYER uses that relay automatically. When it is opened from a plain static host (GitHub Pages), it falls back to PeerJS.

## Deploy it

Anywhere that runs a Node process works: Render, Railway, Fly, a VPS. Point it at this repo with:

- start command: `node server.js` (or `npm start`)
- port: it listens on `$PORT`, default 8080
- health check: `/healthz`

A static-only host (GitHub Pages, Netlify drop) can serve the game but not the relay, so two-player there depends on PeerJS.

## Troubleshooting

- **Graphics blank or crashing:** the game restarts its renderer on its own. The main menu has a DIAGNOSTICS entry that lists what went wrong and names the graphics chip. Adding `?safe` to the address forces the low-resolution mode.
- **Two player will not connect:** both screens show a status line. Use the `server.js` address on both phones, on the same Wi-Fi.

See `three-years/README.md` for the level list, controls and how to personalize it.
