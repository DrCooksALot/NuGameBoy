// ─────────────────────────────────────────────────────────────
//  THREE YEARS — everything personal lives in this one file.
//  Edit freely; no build step. Reload the page to see changes.
// ─────────────────────────────────────────────────────────────
export const CONFIG = {
  her: { name: 'AHANU', look: { skin: 0xc68a5e, hair: 0x1c1412, top: 0xff7ab6, legs: 0x5a3f8a, style: 'long' } },
  him: { name: 'TEK',   look: { skin: 0xd9a577, hair: 0x1d1a22, top: 0x4f50db, legs: 0x23252e, style: 'short' } },

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

  // Per-level overrides: caption under the polaroid, and a real photo.
  // Drop a file at three-years/photos/<level id>.jpg and it replaces the in-game snapshot automatically.
  // Level ids: lightscape, jitney, powwow, wedding, nola, godot, birthday
  captions: {},
};
