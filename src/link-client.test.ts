import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { getShortLinkDisplayURL, getShortLinkURL, submitLink, submitWithChallenge } from "./link-client.ts";
import { parseLinkRequestBody, parseLinkResponse } from "./api.ts";

afterEach(() => mock.restoreAll());

describe("API contract", () => {
  it("accepts only typed request fields", () => {
    for (const value of [null, [], 1, "url"]) {
      assert.deepEqual(parseLinkRequestBody(value), {});
    }
    assert.deepEqual(parseLinkRequestBody({ url: 2, token: false }), {
      url: undefined,
      token: undefined,
    });
    assert.deepEqual(parseLinkRequestBody({ url: "example.com", token: "proof" }), {
      url: "example.com", token: "proof",
    });
  });

  it("rejects unusable success shapes and recognizes API errors", () => {
    for (const key of ["", "/", "https://evil.example", "/one/two", "/a\nb", "/.", "/..", "/\\host"]) {
      assert.equal(parseLinkResponse({ key }), null);
    }
    assert.equal(parseLinkResponse(null), null);
    assert.equal(parseLinkResponse([]), null);
    assert.deepEqual(parseLinkResponse({ key: "/😀#" }), { key: "/😀#" });
    assert.deepEqual(parseLinkResponse({ message: "Bad URL" }), { message: "Bad URL" });
  });
});

describe("link creation client", () => {
  it("sends the shared request contract", async () => {
    mock.method(globalThis, "fetch", async (input, init) => {
      assert.equal(input, "/api/link");
      assert.equal(init?.method, "POST");
      assert.deepEqual(JSON.parse(String(init?.body)), { url: "example.com", token: "proof" });
      return Response.json({ key: "/😀" });
    });
    assert.deepEqual(await submitLink("example.com", "proof"), { key: "/😀" });
  });

  it("renders JSON errors, malformed responses, and network failures as messages", async () => {
    for (const result of [
      new Response("upstream unavailable", { status: 502 }),
      Response.json({ key: "/😀" }, { status: 500 }),
      Response.json({ unexpected: true }),
    ]) {
      mock.method(globalThis, "fetch", async () => result);
      assert.ok("message" in await submitLink("example.com", "proof"));
      mock.restoreAll();
    }
    mock.method(globalThis, "fetch", async () => { throw new Error("network"); });
    assert.ok("message" in await submitLink("example.com", "proof"));
    mock.restoreAll();
    mock.method(globalThis, "fetch", async () => Response.json({ message: "Verification failed" }, { status: 400 }));
    assert.deepEqual(await submitLink("example.com", "proof"), { message: "Verification failed" });
  });

  it("requires a fresh challenge for subsequent attempts and after a failure", async () => {
    let token = "first";
    const used = new Set<string>();
    const reset = () => { token = ""; };
    const submit = async () => {
      assert.ok(token);
      assert.equal(used.has(token), false);
      used.add(token);
      return { key: "/😀" };
    };
    await submitWithChallenge(submit, reset);
    assert.equal(token, "");
    token = "second";
    await submitWithChallenge(submit, reset);
    assert.equal(token, "");
    token = "third";
    await assert.rejects(submitWithChallenge(async () => { throw new Error("KV failed"); }, reset));
    assert.equal(token, "");
  });

  it("round-trips complete emoji paths with fragment and query characters", () => {
    for (const key of ["/####🛒✈#####", "/😀?x=1", "/%23", "/v2-👨~🏻~👨🏻"]) {
      for (const format of [getShortLinkURL, getShortLinkDisplayURL]) {
        const copied = new URL(format("https://emol.ink", key));
        assert.equal(copied.hash, "");
        assert.equal(copied.search, "");
        assert.equal(decodeURIComponent(copied.pathname), key);
      }
    }
  });
});
