// ─────────────────────────────────────────────────────────────
//  THREE YEARS — everything personal lives in this one file.
//  Edit freely; no build step. Reload the page to see changes.
// ─────────────────────────────────────────────────────────────
export const CONFIG = {
  // Deliberately stylised: pink hair and blue hair. They read as game characters, not portraits.
  // style: 'short' | 'long' | 'bun' | 'curly'. Optional: hair2 (highlight), beard, cap, freckles.
  her: { name: 'AHANU', look: { skin: 0xecc4a0, hair: 0xff5fa8, hair2: 0xffa6cf, top: 0x1f6f78, legs: 0x23252e, style: 'curly' } },
  him: { name: 'TEK',   look: { skin: 0xf6dcc6, hair: 0x3a82f6, hair2: 0x7ab0ff, top: 0x2b2b30, legs: 0x3b4a6a, style: 'short', beard: 0x2a5cc8, freckles: true } },

  title: 'Three Years',
  tagline: 'a cartridge for Ahanu',

  // The ending. Shown after the last level, one paragraph per screen.
  birthday: {
    kicker: 'November 19',
    heading: 'Happy Birthday to my only one',
    message: [
      "I don't have the words to tell you how much I love you.",
    ],
    signoff: 'made for Ahanu, by TEK.',
  },
};
