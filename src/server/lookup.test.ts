import assert from "node:assert/strict";
import { test } from "node:test";
import { onRequest } from "../../functions/[emoji].ts";

function context(path: string, value: string | null) {
  const reads: string[] = [];
  return {
    reads,
    request: new Request(`https://emol.ink${path}`),
    env: { EMO_LINK: { get: async (key: string) => { reads.push(key); return value; } } },
  };
}

async function lookup(ctx: ReturnType<typeof context>) {
  return onRequest(ctx as Parameters<typeof onRequest>[0]);
}

async function expectNotFound(response: Response) {
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("location"), null);
  assert.equal((await response.json()).code, 1004);
}

test("malformed percent-encoded lookup paths never touch KV", async () => {
  for (const path of ["/%", "/%GG", "/%F0%9F", "/%C0%AF", "/%ED%A0%80"]) {
    const ctx = context(path, "https://example.com");
    await expectNotFound(await lookup(ctx));
    assert.deepEqual(ctx.reads, []);
  }
});

test("lookup rejects unsafe, relative, missing, and invalid legacy destinations", async () => {
  for (const storedURL of [
    null, "", "example.com", "//example.com", "/relative", "javascript:alert(1)",
    "JaVaScRiPt:alert(1)", "java\tscript:alert(1)", "java\nscript:alert(1)",
    "data:text/html,test", "file:///etc/passwd", "ftp://example.com", "https://[invalid",
  ]) {
    const ctx = context("/%F0%9F%98%80", storedURL);
    await expectNotFound(await lookup(ctx));
    assert.deepEqual(ctx.reads, ["/😀"]);
  }
});

test("lookup decodes emoji keys once and sends a temporary non-cacheable HTTP(S) redirect", async () => {
  for (const path of ["/😀🌍", "/%F0%9F%98%80%F0%9F%8C%8D"]) {
    const ctx = context(path, "HTTPS://EXAMPLE.COM:443/a?b=1#c");
    const response = await lookup(ctx);
    assert.deepEqual(ctx.reads, ["/😀🌍"]);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "https://example.com/a?b=1#c");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(await response.text(), "");
  }
  const ctx = context("/%25F0", "http://example.com/a");
  assert.equal((await lookup(ctx)).headers.get("location"), "http://example.com/a");
  assert.deepEqual(ctx.reads, ["/%F0"]);
});
