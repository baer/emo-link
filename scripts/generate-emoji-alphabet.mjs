import fs from "node:fs";
import path from "node:path";

import emoji from "@unicode/unicode-17.0.0/Binary_Property/Emoji/symbols.mjs";
import emojiComponent from "@unicode/unicode-17.0.0/Binary_Property/Emoji_Component/symbols.mjs";
import basicEmoji from "@unicode/unicode-17.0.0/Sequence_Property/Basic_Emoji/index.mjs";
import emojiTest from "@unicode/unicode-17.0.0/Sequence_Property/Emoji_Test/index.mjs";

// Emoji_Component contributes the single-character building blocks (regional
// indicators etc.), Basic_Emoji the simple sequences, and Emoji_Test the full
// recommended multi-emoji sequences (flags, skin tones, ZWJ chains). The other
// Unicode property files are subsets of these four.

// Single characters that are emoji machinery rather than visible emoji: the
// zero-width joiner (U+200D), variation selector-16 (U+FE0F), and the Unicode
// tag characters used in subdivision flags (U+E0020–U+E007F).
function isInvisible(char) {
  const codePoint = char.codePointAt(0);
  return (
    codePoint === 0x200d ||
    codePoint === 0xfe0f ||
    (codePoint >= 0xe0020 && codePoint <= 0xe007f)
  );
}

// Keep standalone digits out of the emoji token alphabet.
const digit = /^\d$/;

const emojiAlphabet = [
  ...emoji,
  ...emojiComponent,
  ...basicEmoji,
  ...emojiTest,
].filter((str) => !isInvisible(str) && !digit.test(str));

const deduped = Array.from(new Set(emojiAlphabet));

// V2 link IDs index into the first 4096 entries. Their ordering is part of the
// wire format: changing that prefix requires a new encoding version.
if (deduped.length < 4096) {
  throw new Error(
    `Emoji alphabet has only ${deduped.length} entries; 4096 required`
  );
}

if (deduped.some((entry) => entry.includes("~") || /[a-z/]/i.test(entry))) {
  throw new Error("Emoji alphabet conflicts with versioned key syntax");
}

const output = `// Generated from Unicode 17 by scripts/generate-emoji-alphabet.mjs — do not edit.
// The first 4096 entries are the v2 key alphabet; preserve their order.
export const emojiAlphabet: readonly string[] = ${JSON.stringify(deduped, null, 2)};
`;
const destination = path.join(import.meta.dirname, "../src/emoji-alphabet.ts");

if (process.argv.includes("--check")) {
  if (fs.readFileSync(destination, "utf8") !== output) {
    throw new Error("Emoji alphabet is stale; run npm run generate-emoji-alphabet");
  }
} else {
  fs.writeFileSync(destination, output);
}
