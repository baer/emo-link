import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { emojiAlphabet } from "./emoji-alphabet.ts";
import { encodeUUIDAsEmoji } from "./emoji-id.ts";

const alphabetIndex = new Map(
  emojiAlphabet.slice(0, 4096).map((emoji, index) => [emoji, index])
);

function asUUID(hex: string): string {
  return [
    hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16),
    hex.slice(16, 20), hex.slice(20),
  ].join("-");
}

// Independent reference: hexadecimal digits become binary text, then chunks.
function referenceEncode(uuid: string): string {
  const bits = uuid.replaceAll("-", "").split("")
    .map((hex) => parseInt(hex, 16).toString(2).padStart(4, "0")).join("");
  return `v2-${Array.from({ length: 11 }, (_, index) =>
    emojiAlphabet[parseInt(bits.slice(index * 12, index * 12 + 12), 2)]
  ).join("~")}`;
}

function tokens(key: string): string[] {
  assert.ok(key.startsWith("v2-"));
  const result = key.slice(3).split("~");
  assert.equal(result.length, 11);
  return result;
}

// Reconstruct the complete input as binary text to check unambiguous parsing
// and all bit positions without sharing the encoder's BigInt operations.
function reconstructHex(key: string): string {
  const bits = tokens(key).map((token, position) => {
    const index = alphabetIndex.get(token);
    assert.notEqual(index, undefined);
    const width = position === 10 ? 8 : 12;
    assert.ok(index! < 2 ** width);
    return index!.toString(2).padStart(width, "0");
  }).join("");
  assert.equal(bits.length, 128);
  return Array.from({ length: 32 }, (_, index) =>
    parseInt(bits.slice(index * 4, index * 4 + 4), 2).toString(16)
  ).join("");
}

describe("Unicode 17 emoji alphabet", () => {
  it("has unique tokens, disjoint from the separator, version prefix, and slash", () => {
    assert.ok(emojiAlphabet.length >= 4096);
    assert.equal(new Set(emojiAlphabet).size, emojiAlphabet.length);
    for (const entry of emojiAlphabet) {
      assert.ok(entry.length > 0);
      assert.doesNotMatch(entry, /[a-z/~]/i);
      assert.doesNotMatch(entry, /^\d$/);
      assert.doesNotMatch(entry, /^(?:\u200d|\ufe0f|[\u{e0020}-\u{e007f}])$/u);
    }
  });

  it("pins the ordered v2 alphabet so regeneration cannot silently change keys", () => {
    assert.equal(
      createHash("sha256").update(JSON.stringify(emojiAlphabet.slice(0, 4096))).digest("hex"),
      "4eed246df2ba37b0294dd38d12cd9b8f0b780dfec21fba5a56db567e45b6a2f2"
    );
  });

  it("matches the generator output", () => {
    execFileSync(process.execPath, [
      fileURLToPath(new URL("../scripts/generate-emoji-alphabet.mjs", import.meta.url)),
      "--check",
    ]);
  });
});

describe("encodeUUIDAsEmoji", () => {
  it("encodes zero and maximum UUIDs with ten 12-bit tokens and one 8-bit token", () => {
    assert.equal(
      encodeUUIDAsEmoji("00000000-0000-0000-0000-000000000000"),
      `v2-${Array(11).fill(emojiAlphabet[0]).join("~")}`
    );
    assert.equal(
      encodeUUIDAsEmoji("ffffffff-ffff-ffff-ffff-ffffffffffff"),
      `v2-${[...Array(10).fill(emojiAlphabet[4095]), emojiAlphabet[255]].join("~")}`
    );
  });

  it("agrees with an independent reference for fixed vectors and every input bit", () => {
    const vectors = [
      "00000000-0000-0000-0000-000000000000",
      "ffffffff-ffff-ffff-ffff-ffffffffffff",
      "00112233-4455-4677-8899-aabbccddeeff",
      "01234567-89ab-cdef-0123-456789abcdef",
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "55555555-5555-5555-5555-555555555555",
      ...Array.from({ length: 128 }, (_, bit) =>
        asUUID((1n << BigInt(bit)).toString(16).padStart(32, "0"))
      ),
    ];
    for (const uuid of vectors) {
      const actual = encodeUUIDAsEmoji(uuid);
      assert.equal(actual, referenceEncode(uuid));
      assert.equal(reconstructHex(actual), uuid.replaceAll("-", ""));
    }
  });

  it("preserves every possible index in every token position", () => {
    // Unique alphabet entries plus a separator absent from every entry make
    // token parsing injective. Exhaust all digit values at each bit position;
    // reconstructing those tokens checks the full fixed-width representation.
    for (let position = 0; position < 11; position++) {
      const width = position === 10 ? 8 : 12;
      const shift = position === 10 ? 0 : 8 + (9 - position) * 12;
      for (let index = 0; index < 2 ** width; index++) {
        const hex = (BigInt(index) << BigInt(shift)).toString(16).padStart(32, "0");
        const key = encodeUUIDAsEmoji(asUUID(hex));
        assert.equal(tokens(key)[position], emojiAlphabet[index]);
        assert.equal(reconstructHex(key), hex);
      }
    }
  });

  it("separates the valid UUIDv4 pair that collides when tokens are concatenated", () => {
    const first = encodeUUIDAsEmoji("2441d779-b123-4000-8012-312312312312");
    const second = encodeUUIDAsEmoji("79b2441d-7123-4000-8012-312312312312");
    assert.equal(tokens(first).join(""), "👨🏻👨🏻🌿🛒✈🌿🌿🌿🌿⌨");
    assert.equal(tokens(first).join(""), tokens(second).join(""));
    assert.notEqual(first, second);
    assert.equal(reconstructHex(first), "2441d779b12340008012312312312312");
    assert.equal(reconstructHex(second), "79b2441d712340008012312312312312");
  });

  it("round-trips reserved emoji characters through one encoded URL path segment", () => {
    for (const uuid of [
      "00000000-0000-4000-8000-000000000000",
      "ffffffff-ffff-4fff-bfff-ffffffffffff",
    ]) {
      const key = encodeUUIDAsEmoji(uuid);
      const url = new URL(`https://emol.ink/${encodeURIComponent(key)}`);
      assert.equal(decodeURIComponent(url.pathname), `/${key}`);
      assert.equal(url.pathname.split("/").length, 2);
      assert.equal(url.hash, "");
      assert.equal(url.search, "");
    }
  });

  it("treats hexadecimal case as the same UUID", () => {
    const uuid = "00112233-4455-4677-8899-aabbccddeeff";
    assert.equal(encodeUUIDAsEmoji(uuid), encodeUUIDAsEmoji(uuid.toUpperCase()));
  });

  it("rejects malformed UUIDs instead of truncating or coercing input", () => {
    for (const uuid of [
      "", "1", "-1", "0x01", "gggggggg-gggg-gggg-gggg-gggggggggggg",
      "00000000000000000000000000000000",
      "00000000-0000-0000-0000-00000000000",
      "00000000-0000-0000-0000-0000000000000",
      "00000000-0000-0000-0000000000000000",
      "{00000000-0000-0000-0000-000000000000}",
      " 00000000-0000-0000-0000-000000000000",
      "00000000-0000-0000-0000-000000000000\n",
      "00000000-0000-0000-0000-000000000000 ",
    ]) {
      assert.throws(() => encodeUUIDAsEmoji(uuid), TypeError);
    }
  });
});
