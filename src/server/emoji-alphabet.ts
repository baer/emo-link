const emoji = new Set([
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
]);

export default Array.from(emoji);
