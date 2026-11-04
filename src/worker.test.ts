import assert from "node:assert/strict";
import { test } from "node:test";
import worker from "../worker/index.ts";

function setup() {
  const values = new Map<string, string>();
  const reads: string[] = [];
  const assets: string[] = [];
  let assetStatus = 404;
  const env = {
    TURNSTILE_SECRET: "configured-secret",
    EMO_LINK: {
      get: async (key: string) => { reads.push(key); return values.get(key) ?? null; },
      put: async (key: string, value: string) => { values.set(key, value); },
    },
    ASSETS: {
      fetch: async (request: Request) => {
        assets.push(new URL(request.url).pathname);
        return new Response("asset", { status: assetStatus });
      },
    },
  };
  const fetch = (path: string, init?: RequestInit) => worker.fetch(
    new Request(`https://emol.ink${path}`, init),
    env as Parameters<typeof worker.fetch>[1]
  );
  return { env, values, reads, assets, fetch, setAssetStatus: (status: number) => { assetStatus = status; } };
}

test("API only accepts POST and rejects malformed JSON without touching KV", async () => {
  const ctx = setup();
  const rejected = await ctx.fetch("/api/link");
  assert.equal(rejected.status, 405);
  assert.equal(rejected.headers.get("allow"), "POST");
  const invalid = await ctx.fetch("/api/link", { method: "POST", body: "{" });
  assert.equal(invalid.status, 400);
  assert.equal(ctx.values.size, 0);
  assert.deepEqual(ctx.reads, []);
});

test("creation and encoded lookup round-trip a v2 key without leaking destinations into logs", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ success: true }));
  const log = t.mock.method(console, "log", () => {});
  const ctx = setup();
  const created = await ctx.fetch("/api/link", {
    method: "POST", body: JSON.stringify({ url: "example.com/private?secret=one", token: "proof" }),
    headers: { "cf-connecting-ip": "192.0.2.1", "user-agent": "private-client" },
  });
  assert.equal(created.status, 200);
  const { key } = await created.json();
  assert.match(key, /^\/v2-/);
  assert.equal(log.mock.callCount(), 1);
  assert.deepEqual(JSON.parse(log.mock.calls[0].arguments[0]), { event: "link.created", key });
  const followed = await ctx.fetch(`/${encodeURIComponent(key.slice(1))}`);
  assert.equal(followed.status, 302);
  assert.equal(followed.headers.get("location"), "https://example.com/private?secret=one");
  assert.equal(followed.headers.get("cache-control"), "no-store");
});

test("existing emoji-only links work independently of the v2 alphabet", async () => {
  const ctx = setup();
  const key = "/😻👩🏿‍🤝‍👨🏾👃🏾🛴👩🏾‍🎨🏍️🤷🏻‍♀🧑🏻‍🎨🧹🚚✋🏽";
  ctx.values.set(key, "https://example.com/legacy");
  for (const method of ["GET", "HEAD"]) {
    const response = await ctx.fetch(`/${encodeURIComponent(key.slice(1))}`, { method });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "https://example.com/legacy");
    assert.equal(await response.text(), "");
  }
});

test("malformed and oversized keys return 404 without a KV request", async () => {
  const ctx = setup();
  for (const path of ["/%", "/%GG", "/%F0%9F", `/${"a".repeat(512)}`, `/${"😀".repeat(128)}`]) {
    assert.equal((await ctx.fetch(path)).status, 404);
  }
  assert.deepEqual(ctx.reads, []);
});

test("unsafe stored destinations never become redirects or asset fallbacks", async () => {
  for (const target of ["javascript:alert(1)", "data:text/plain,test", "file:///etc/passwd", "example.com"]) {
    const ctx = setup();
    ctx.values.set("/😀", target);
    const response = await ctx.fetch("/😀");
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("location"), null);
    assert.deepEqual(ctx.assets, []);
  }
});

test("root and nested assets are forwarded without KV reads", async () => {
  const ctx = setup();
  ctx.setAssetStatus(200);
  for (const path of ["/", "/_next/static/chunk.js"]) {
    assert.equal(await (await ctx.fetch(path)).text(), "asset");
  }
  assert.deepEqual(ctx.reads, []);
  assert.deepEqual(ctx.assets, ["/", "/_next/static/chunk.js"]);
});

test("single-segment missing keys can resolve assets or a friendly 404", async () => {
  const ctx = setup();
  ctx.setAssetStatus(200);
  assert.equal(await (await ctx.fetch("/favicon.ico")).text(), "asset");
  ctx.setAssetStatus(404);
  const response = await ctx.fetch("/unknown");
  assert.equal(response.status, 404);
  assert.equal((await response.json()).code, 1004);
});

test("non-navigation methods cannot follow links and KV failures remain observable", async () => {
  const ctx = setup();
  const response = await ctx.fetch("/😀", { method: "POST" });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
  assert.deepEqual(ctx.reads, []);
  ctx.env.EMO_LINK.get = async () => { throw new Error("KV unavailable"); };
  await assert.rejects(ctx.fetch("/😀"), /KV unavailable/);
});
