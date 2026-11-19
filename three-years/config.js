// ─────────────────────────────────────────────────────────────
//  THREE YEARS — everything personal lives in this one file.
//  Edit freely; no build step. Reload the page to see changes.
// ─────────────────────────────────────────────────────────────
export const CONFIG = {
  // style: 'short' | 'long' | 'bun' | 'curly'. Optional: beard: <colour>, cap: <colour>.
  her: { name: 'AHANU', look: { skin: 0xd9a47c, hair: 0x6b3a24, top: 0x7a2238, legs: 0x23252e, style: 'curly' } },
  him: { name: 'TEK',   look: { skin: 0xdcae8c, hair: 0x1c1816, top: 0x2b2b30, legs: 0x3b4a6a, style: 'short', beard: 0x2a211c } },

  title: 'Three Years',
  tagline: 'a cartridge for Ahanu',

  // Shown after the last level.
  birthday: {
    heading: 'Happy Birthday, Nunu',
    message: 'Three years of jitneys, weddings, fry bread and thunderstorms. Every level in here was a real day, and I would replay all of them. I love you more than pizza.',
    // Optional surprise revealed after the message. Put an image in three-years/photos/ and name it here,
    // and/or write a line of text. Leave both empty to skip the reveal.
    giftImage: '',          // e.g. 'photos/gift.jpg'
    giftText: '',           // e.g. 'Pack a bag. We leave Friday.'
  },

  // Real photos shown as a polaroid roll at the very end. Missing files are skipped.
  gallery: ['photos/us-1.jpg', 'photos/us-2.jpg', 'photos/us-3.jpg', 'photos/us-4.jpg', 'photos/us-5.jpg', 'photos/us-6.jpg', 'photos/us-7.jpg', 'photos/jitney.jpg'],

  // Per-level overrides: caption under the polaroid, and a real photo.
  // Drop a file at three-years/photos/<level id>.jpg and it replaces the in-game snapshot automatically.
  // Level ids: lightscape, jitney, powwow, wedding, nola, godot, birthday
  captions: {},
};
