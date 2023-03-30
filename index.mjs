import crypto from "crypto";
import { readFile } from "fs/promises";

// Emojis are spread through lots of code point ranges, so it's not possible to
// use a simple range as you might with ASCII values. This gets much more
// complicated with skin-tone variations and such. For the time being, I'm
// relying on a pre-generated set from Kaggle. It's probably a bit out of date,
// but it'll do for now.
// https://www.kaggle.com/datasets/eliasdabbas/emoji-data-descriptions-codepoints?resource=download&select=emoji_df.csv
const EMOJI_ALPHABET = JSON.parse(
  await readFile(new URL("./emoji-alphabet.json", import.meta.url))
);

// I have 4581 emoji in my alphabet require 12 bits to encode a truncated set
// (4096) or 13 bits for the complete set (8192). I've chosen to use 12 since
// padding several thousand chars wouldconsiderably complicate the problem for
// no real benefit
//
// UUIDs are 128-bit numbers (I'm ignoring semi-stable bits), which gives 2^128
// possible combinations. With 12 bits per char, we need 11 emojis per UUID
const BITS_PER_CHARACTER = 12;

function convertHexToBinary(hexNum) {
  return parseInt(hexNum, 16).toString(2).padStart(8, `0`);
}

function chunkString(str, length) {
  return str.match(new RegExp(".{1," + length + "}", "g"));
}

function encodeUUIDAsEmoji(uuid) {
  const uuidAsBinaryString = chunkString(uuid.replaceAll(`-`, ``), 2)
    .map(convertHexToBinary)
    .join(``);

  return chunkString(uuidAsBinaryString, BITS_PER_CHARACTER)
    .map((binaryNumber) => parseInt(binaryNumber, 2))
    .map((emojiIndex) => EMOJI_ALPHABET[emojiIndex])
    .join("");
}

export function generateURISafeEmojiUUID() {
  const uuid = crypto.randomUUID();
  const uuidAsEmoji = encodeUUIDAsEmoji(uuid);
  return encodeURIComponent(uuidAsEmoji);
}

console.log(generateURISafeEmojiUUID());
