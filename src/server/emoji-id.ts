import emojiAlphabet from "./emoji-alphabet.json";

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
 * Encodes a UUID as a string of 11 Emoji from the Unicode 15 set.
 *
 * Explaination:
 *   UUID Combinations = 2^122 (122 random bits + 4 to specify version/variant)
 *   2^122 - 4096^10 ~=  3.99×10^36
 *   2^122 - 4096^11 ~= -2.24 x 10^19
 *
 * @param uuid - A UUID string.
 * @returns A string of emojis representing the input UUID.
 */
export function encodeUUIDAsEmoji(uuid: string): string {
  // Convert the UUID to a binary string
  const uuidAsBinaryString = chunkString(uuid.replaceAll(`-`, ``), 2)
    .map(hexToBinary)
    .join(``);

  // The alphabet size determines the number of bits required to encode the
  // complete set. The Unicode 15 Emoji set includes 4764 emojis. This
  // requires either 12 bits to encode a slightly truncated set (2^12 = 4096), of
  // 13 bits for the complete set. I've chosen to use 12 since padding several
  // thousand chars would considerably complicate the problem for no real benefit
  const bitsPerEmoji = 12;

  // Convert the binary string to an emoji string using the emoji alphabet
  return chunkString(uuidAsBinaryString, bitsPerEmoji)
    .map((binaryNumber: string) => parseInt(binaryNumber, 2))
    .map((emojiIndex: number) => emojiAlphabet[emojiIndex])
    .join("");
}

/**
 * @returns A URL-safe emoji-encoded UUID string.
 */
export function generateURISafeEmojiUUID(): string {
  const uuid = crypto.randomUUID();
  const uuidAsEmoji = encodeUUIDAsEmoji(uuid);
  return encodeURIComponent(uuidAsEmoji);
}
