import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeURL, parseHTTPURL } from "./url.ts";

test("creation canonicalizes HTTP(S) and supplies HTTPS for bare hosts", () => {
  assert.equal(normalizeURL("example.com/a?x=1#part"), "https://example.com/a?x=1#part");
  assert.equal(normalizeURL(" HTTP://EXAMPLE.COM:80/a "), "http://example.com/a");
  assert.equal(normalizeURL("https://münich.example/😀"), "https://xn--mnich-kva.example/%F0%9F%98%80");
});

test("creation and lookup reject non-HTTP schemes and unparseable URLs", () => {
  for (const input of [
    "javascript:alert(1)", "JaVaScRiPt:alert(1)", "java\tscript:alert(1)",
    "java\nscript:alert(1)", "data:text/html,test", "file:///etc/passwd",
    "ftp://example.com", "mailto:user@example.com", "", " ",
    "https://[invalid", "ht\ttps://[invalid", "https://example.com:99999", "https://exa%mple.com",
  ]) {
    assert.equal(normalizeURL(input), null, input);
    assert.equal(parseHTTPURL(input), null, input);
  }
});

test("lookup requires an absolute HTTP(S) URL without a bare-host fallback", () => {
  for (const input of ["example.com", "//example.com", "/relative/path"]) {
    assert.equal(parseHTTPURL(input), null, input);
  }
  assert.equal(parseHTTPURL("HTTPS://EXAMPLE.COM/a"), "https://example.com/a");
});
