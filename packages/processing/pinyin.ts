/**
 * Taken from: https://github.com/kevb34ns/pinyinify/blob/master/pinyinify.js
 *
 * An object holding arrays of Unicode tone marks for each vowel.
 * Each tone mark can be accessed very intuitively. For example,
 * to access the tone marked version of a2, you would call
 * toneMarks["a"][2].
 *
 * @type {Object}
 */
var toneMarks = {
  a: ["a", "\u0101", "\u00e1", "\u01ce", "\u00e0", "a"],
  e: ["e", "\u0113", "\u00e9", "\u011b", "\u00e8", "e"],
  i: ["i", "\u012b", "\u00ed", "\u01d0", "\u00ec", "i"],
  o: ["o", "\u014d", "\u00f3", "\u01d2", "\u00f2", "o"],
  u: ["u", "\u016b", "\u00fa", "\u01d4", "\u00f9", "u"],
  v: ["\u00fc", "\u01d6", "\u01d8", "\u01da", "\u01dc", "\u00fc"],
};

const getToneFromPinyin = (pinyin: string) => {
  if (!pinyin) {
    return;
  }

  let rawToneMarker: number;
  try {
    rawToneMarker = parseInt(pinyin[pinyin.length - 1], 10);
  } catch (error) {
    // return early since we don't know if this has a tone
    return pinyin;
  }

  if (rawToneMarker === 0) {
    return rawToneMarker;
  }
};
