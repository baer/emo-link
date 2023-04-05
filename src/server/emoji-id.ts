import emojiAlphabet from "./emoji-alphabet.json";

// I have 4764 emoji in my alphabet require 11 bits to encode a truncated set
// (4096) or 13 bits for the complete set (8192). I've chosen to use 12 since
// padding several thousand chars wouldconsiderably complicate the problem for
// no real benefit
//
// Using 12 bits per char, you will need 11 chars to encode a UUID.
// UUID Combinations = 2^122 (122 random bits + 4 to specify version/variant)
// 2^122 - 4096^10 ~=  3.99×10^36
// 2^122 - 4096^11 ~= -2.24 x 10^19
const BITS_PER_CHARACTER = 12;

/**
 * Converts a hexadecimal number to an 8-bit binary string.
 * @param hexNum - A hexadecimal number as a string.
 * @returns An 8-bit binary string representation of the input hex number.
 */
function hexToBinary(hexNum: string): string {
  return parseInt(hexNum, 16).toString(2).padStart(8, `0`);
}

/**
 * Splits a string into chunks of the specified length.
 * @param str - The input string to be chunked.
 * @param length - The desired chunk length.
 * @returns An array of strings, each with the specified chunk length.
 */
function chunkString(str: string, length: number): string[] {
  return str.match(new RegExp(".{1," + length + "}", "g")) || [];
}

/**
 * Encodes a UUID as a string of Emoji from the Unicode 15 set.
 * @param uuid - A UUID string.
 * @returns A string of emojis representing the input UUID.
 */
export function encodeUUIDAsEmoji(uuid: string): string {
  const uuidAsBinaryString = chunkString(uuid.replaceAll(`-`, ``), 2)
    .map(hexToBinary)
    .join(``);

  return chunkString(uuidAsBinaryString, BITS_PER_CHARACTER)
    .map((binaryNumber: string) => parseInt(binaryNumber, 2))
    .map((emojiIndex: number) => emojiAlphabet[emojiIndex])
    .join("");
}

export function generateURISafeEmojiUUID(): string {
  const uuid = crypto.randomUUID();
  const uuidAsEmoji = encodeUUIDAsEmoji(uuid);
  return encodeURIComponent(uuidAsEmoji);
}
