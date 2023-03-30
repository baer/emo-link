import crypto from "crypto";

// UUIDs are 128-bit numbers, which gives 2^128 possible combinations (this is
// a rough number since there are stable bits, but this isn't material to the problem)
//
// As of v15, there are 1,424 emojis not including skin-tones and other
// multi-char variants, which would require 10 bits to encode a truncated set
// (1024) or 11 bits for the complete set (2048). However, if we used the
// complete set, we'd need 624 additional chars for which would considerably
// complicate the problem.
const BITS_PER_CHARACTER = 10;

// Emojis are spread through lots of code point ranges, so it's not possible to
// use a simple range as you might with ASCII values. Luckily, Unicode gives
// you a tool.
// https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B:Emoji%3DYes:%5D&esc=on&g=&i=
const EMOJI_ALPHABET = new Array(1024).fill(1);

function convertHexToBinary(hexNum) {
  return parseInt(hexNum, 16).toString(2).padStart(8, `0`);
}

function chunkString(str, length) {
  return str.match(new RegExp(".{1," + length + "}", "g"));
}

function encodeUUIDAsEmoji(uuid) {
  // TODO: Validate UUID

  const uuidAsBinaryString = chunkString(uuid.replaceAll(`-`, ``), 2)
    .map(convertHexToBinary)
    .join(``);

  return chunkString(uuidAsBinaryString, BITS_PER_CHARACTER)
    .map((binaryNumber) => parseInt(binaryNumber, 2))
    .map((emojiIndex) => EMOJI_ALPHABET[emojiIndex])
    .map(encodeURIComponent)
    .join("");
}

const uuid = crypto.randomUUID();
console.log(encodeUUIDAsEmoji(uuid));
