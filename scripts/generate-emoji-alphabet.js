const fs = require("fs");
const path = require(`path`);

// Unicode has several non-printable characters. We don't want those.
// https://en.wikipedia.org/wiki/Zero-width_space
const invisibleCodePoints = [
  8205, 65039, 917536, 917537, 917538, 917539, 917540, 917541, 917542, 917543,
  917544, 917545, 917546, 917547, 917548, 917549, 917550, 917551, 917552,
  917553, 917554, 917555, 917556, 917557, 917558, 917559, 917560, 917561,
  917562, 917563, 917564, 917565, 917566, 917567, 917568, 917569, 917570,
  917571, 917572, 917573, 917574, 917575, 917576, 917577, 917578, 917579,
  917580, 917581, 917582, 917583, 917584, 917585, 917586, 917587, 917588,
  917589, 917590, 917591, 917592, 917593, 917594, 917595, 917596, 917597,
  917598, 917599, 917600, 917601, 917602, 917603, 917604, 917605, 917606,
  917607, 917608, 917609, 917610, 917611, 917612, 917613, 917614, 917615,
  917616, 917617, 917618, 917619, 917620, 917621, 917622, 917623, 917624,
  917625, 917626, 917627, 917628, 917629, 917630, 917631,
].map((codePoint) => String.fromCodePoint(codePoint));

function isBadCodePoint(char) {
  return invisibleCodePoints.includes(char);
}

function isNumber(char) {
  return /\d/.test(char);
}

const emoji = [
  ...require("@unicode/unicode-15.0.0/Binary_Property/Emoji/symbols.js"),
  ...require("@unicode/unicode-15.0.0/Binary_Property/Emoji_Component/symbols.js"),
  ...require("@unicode/unicode-15.0.0/Binary_Property/Emoji_Modifier/symbols.js"),
  ...require("@unicode/unicode-15.0.0/Binary_Property/Emoji_Modifier_Base/symbols.js"),
  ...require("@unicode/unicode-15.0.0/Binary_Property/Emoji_Presentation/symbols.js"),
  ...require("@unicode/unicode-15.0.0/Sequence_Property/Basic_Emoji/index.js"),
  ...require("@unicode/unicode-15.0.0/Sequence_Property/Emoji_Keycap_Sequence/index.js"),
  ...require("@unicode/unicode-15.0.0/Sequence_Property/Emoji_Test/index.js"),
  ...require("@unicode/unicode-15.0.0/Sequence_Property/RGI_Emoji/index.js"),
  ...require("@unicode/unicode-15.0.0/Sequence_Property/RGI_Emoji_Flag_Sequence/index.js"),
  ...require("@unicode/unicode-15.0.0/Sequence_Property/RGI_Emoji_Modifier_Sequence/index.js"),
  ...require("@unicode/unicode-15.0.0/Sequence_Property/RGI_Emoji_Tag_Sequence/index.js"),
  ...require("@unicode/unicode-15.0.0/Sequence_Property/RGI_Emoji_ZWJ_Sequence/index.js"),
].filter((str) => !isNumber(str) && !isBadCodePoint(str));

const deduped = Array.from(new Set(emoji));

fs.writeFileSync(
  path.join(__dirname, "../src/server/emoji-alphabet.json"),
  JSON.stringify(deduped, null, 2)
);
