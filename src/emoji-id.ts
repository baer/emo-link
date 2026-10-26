import { emojiAlphabet } from "./emoji-alphabet.ts";

const EMOJI_PER_UUID = 11;

/**
 * Encodes a canonical hyphenated UUID (any version/variant) as a single path
 * segment: `v2-` followed by 11 emoji tokens separated by `~`.
 *
 * Ten tokens carry 12 bits each; the final token carries 8. The separator is
 * absent from the alphabet, so the tokens uniquely preserve all 128 input bits
 * even when an emoji is a prefix of another. The version keeps new keys separate
 * from historical concatenated emoji keys. Encode this segment with
 * encodeURIComponent when constructing a URL; KV keys retain the literal emoji.
 */
export function encodeUUIDAsEmoji(uuid: string): string {
  if (
    typeof uuid !== "string" ||
    uuid.length !== 36 ||
    !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(uuid)
  ) {
    throw new TypeError("Expected a canonical hyphenated UUID");
  }

  let value = BigInt(`0x${uuid.replaceAll("-", "")}`);
  const tokens = [emojiAlphabet[Number(value & 0xffn)]];
  value >>= 8n;

  for (let i = 1; i < EMOJI_PER_UUID; i++, value >>= 12n) {
    tokens.push(emojiAlphabet[Number(value & 0xfffn)]);
  }

  return `v2-${tokens.toReversed().join("~")}`;
}
