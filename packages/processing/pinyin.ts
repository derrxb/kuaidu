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
const toneMarks: Record<string, string[]> = {
  a: ["a", "\u0101", "\u00e1", "\u01ce", "\u00e0", "a"],
  e: ["e", "\u0113", "\u00e9", "\u011b", "\u00e8", "e"],
  i: ["i", "\u012b", "\u00ed", "\u01d0", "\u00ec", "i"],
  o: ["o", "\u014d", "\u00f3", "\u01d2", "\u00f2", "o"],
  u: ["u", "\u016b", "\u00fa", "\u01d4", "\u00f9", "u"],
  v: ["\u00fc", "\u01d6", "\u01d8", "\u01da", "\u01dc", "\u00fc"],
};

const vowelIndexRegex = /[aeiou]|u:/;
const vowelRegex: Record<string, RegExp> = {
  a: new RegExp("a", "g"),
  e: new RegExp("e", "g"),
  i: new RegExp("i", "g"),
  o: new RegExp("o", "g"),
  u: new RegExp("u", "g"),
  v: new RegExp("u:", "g"),
};

const findFirstVowelIndex = (pinyin: string): number => {
  const vowelMatches = pinyin.match(vowelIndexRegex);
  return vowelMatches ? vowelMatches.index || -1 : -1;
};

const getToneMark = (
  pinyin: string,
  vowelIndex: number,
  toneNumber: number
) => {
  let vowel = pinyin[vowelIndex];
  let toneMarker = vowel;

  if (vowel === "i" || vowel === "u") {
    const iuInText = pinyin.includes("iu");
    const uiInText = pinyin.includes("ui");

    // put the tone on the u!
    if (iuInText) {
      return pinyin.replace(/(iu)/, `i${toneMarks["u"][toneNumber]}`);
    }

    if (uiInText) {
      return pinyin.replace(/(ui)/, `u${toneMarks["i"][toneNumber]}`);
    }
  }

  // Rule #3: `u:` is tracked as `v` to distinguish between `u` and `v`
  if (vowel === "u" && pinyin.includes("u:")) {
    toneMarker = "v";
    vowel = "u:";

    // Rule #3: JQX turns `u:` to `u`
    const previousIsJQX = !!pinyin[vowelIndex - 1]?.match(/[jqx]/)?.[0];
    if (previousIsJQX) {
      toneMarker = "u";
      vowel = "u";
    }
  }

  return pinyin.replace(vowelRegex[vowel], toneMarks[toneMarker][toneNumber]);
};

// Step 1: Memoization function
const memoize = (func: (...args: any[]) => any) => {
  const cache: Record<string, any> = {};
  return (...args: any[]) => {
    const key = JSON.stringify(args);
    if (key in cache) {
      return cache[key];
    }
    const result = func(...args);
    cache[key] = result;
    return result;
  };
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

  const normalizedPinyin = pinyin.slice(0, pinyin.length - 1).toLowerCase();
  const vowelIndex = findFirstVowelIndex(normalizedPinyin);
  const pinyinWithToneMarkers = getToneMark(
    normalizedPinyin,
    vowelIndex,
    rawToneMarker
  );

  return pinyinWithToneMarkers;
};

/**
 * Returns the pinyin with tone markers following some of the rules of pinyin.
 *
 * Rules https://www.hanhai-language.com.sg/blog/2021/10/28/4-important-hanyu-pinyin-rules-you-should-know
 * @param pinyin
 * @returns
 */
export const memoizeGetToneFromPinyin = memoize(getToneFromPinyin);
