// ─────────────────────────────────────────────────────────────
//  THREE YEARS — everything personal lives in this one file.
//  Edit freely; no build step. Reload the page to see changes.
// ─────────────────────────────────────────────────────────────
export const CONFIG = {
  // Deliberately stylised, so they read as game characters and not portraits.
  // style: 'short' | 'long' | 'bun' | 'curly'. Optional: hair2 (highlight), beard, cap, freckles, antlers, dots, collar.
  her: { name: 'NUNU', look: { skin: 0xecc4a0, hair: 0xff5fa8, hair2: 0xffa6cf, top: 0x9a84f0, dots: 0xfff2a8, collar: 0xffffff, legs: 0xe5352f, style: 'curly', antlers: 0xe5352f } },
  him: { name: 'TEK',   look: { skin: 0xf6dcc6, hair: 0x2c1e18, hair2: 0x4a3428, top: 0x2b2b30, legs: 0x3b4a6a, style: 'short', beard: 0x261a14, freckles: true } },

  title: 'Three Years',
  tagline: 'a cartridge for Nunu',

  // The ending. Shown after the last level, one paragraph per screen.
  birthday: {
    kicker: 'November 19',
    heading: 'Happy Birthday to my only one',
    message: [
      "I don't have the words to tell you how much I love you.",
    ],
    signoff: 'made for Nunu, by TEK.',
  },
};
