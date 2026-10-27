import assert from "node:assert/strict";
import { test } from "node:test";
import { createLink } from "./create-link.ts";
import { VERIFY_TURNSTILE_TOKEN_ENDPOINT } from "../constants.ts";

function context(body: string, secret: string | undefined = "configured-secret") {
  const writes: Array<[string, string]> = [];
  return {
    writes,
    request: new Request("https://emol.ink/api/link", { method: "POST", body }),
    env: {
      TURNSTILE_SECRET: secret,
      EMO_LINK: { put: async (key: string, value: string) => { writes.push([key, value]); } },
    },
  };
}

function unexpectedEncode(): never {
  throw new Error("Invalid requests must not generate IDs");
}

async function expectError(response: Response, code: number) {
  assert.equal(response.status, 400);
  assert.equal(response.headers.get("content-type"), "application/json;charset=UTF-8");
  const body = await response.json();
  assert.equal(body.code, code);
  assert.equal(typeof body.message, "string");
}

test("invalid request bodies and unsafe URLs never verify or write KV", async (t) => {
  const verify = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Invalid requests must not verify tokens");
  });
  for (const body of [
    "{", "null", "true", "42", '"https://example.com"', "[]", "{}",
    ...[null, true, 42, {}, [], "", "javascript:alert(1)", "java\nscript:alert(1)", "data:text/html,test", "ftp://example.com"]
      .map((url) => JSON.stringify({ url, token: "token" })),
  ]) {
    const ctx = context(body);
    await expectError(await createLink(ctx, unexpectedEncode), 1001);
    assert.deepEqual(ctx.writes, []);
  }
  assert.equal(verify.mock.callCount(), 0);
});

test("missing or invalid tokens and missing secrets fail closed without external calls", async (t) => {
  const verify = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Unconfigured or invalid requests must not verify tokens");
  });
  for (const token of [undefined, null, true, 42, {}, [], "", " \t"]) {
    const ctx = context(JSON.stringify({ url: "example.com", token }));
    await expectError(await createLink(ctx, unexpectedEncode), 1002);
    assert.deepEqual(ctx.writes, []);
  }
  for (const secret of [undefined, "", " \t"]) {
    const ctx = context(JSON.stringify({ url: "example.com", token: "token" }));
    ctx.env.TURNSTILE_SECRET = secret;
    await expectError(await createLink(ctx, unexpectedEncode), 1002);
    assert.deepEqual(ctx.writes, []);
  }
  assert.equal(verify.mock.callCount(), 0);
});

test("Turnstile must return an OK response with literal success true", async (t) => {
  const outcomes = [
    () => { throw new Error("Network failure"); },
    () => new Response('{"success":true}', { status: 503 }),
    () => new Response("invalid JSON"),
    ...[null, [], true, {}, { success: false }, { success: "true" }, { success: 1 }]
      .map((body) => () => Response.json(body)),
  ];
  for (const [index, outcome] of outcomes.entries()) {
    await t.test(`rejects verification outcome ${index}`, async (subtest) => {
      const verify = subtest.mock.method(globalThis, "fetch", async () => outcome());
      const ctx = context(JSON.stringify({ url: "https://example.com", token: "token" }));
      await expectError(await createLink(ctx, unexpectedEncode), 1002);
      assert.deepEqual(ctx.writes, []);
      assert.equal(verify.mock.callCount(), 1);
    });
  }
});

test("verified creation stores the normalized URL and returns the shared response shape", async (t) => {
  const verify = t.mock.method(globalThis, "fetch", async (input, init) => {
    assert.equal(input, VERIFY_TURNSTILE_TOKEN_ENDPOINT);
    assert.equal(init?.method, "POST");
    const body = new URLSearchParams(init?.body as string);
    assert.equal(body.get("secret"), "secret&with=special+characters");
    assert.equal(body.get("response"), "token&with=special+characters");
    assert.equal(new Headers(init?.headers).get("content-type"), "application/x-www-form-urlencoded");
    return Response.json({ success: true });
  });
  const ctx = context(JSON.stringify({ url: "example.com/a", token: "token&with=special+characters" }), "secret&with=special+characters");
  let encodedUUID: string | undefined;
  const response = await createLink(ctx, (uuid) => { encodedUUID = uuid; return "😀🌍"; });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.match(encodedUUID ?? "", /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.deepEqual(body, { key: "/😀🌍" });
  assert.deepEqual(ctx.writes, [["/😀🌍", "https://example.com/a"]]);
  assert.equal(verify.mock.callCount(), 1);
});


test("persistence failures reject without reporting a created link", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ success: true }));
  const ctx = context(JSON.stringify({ url: "example.com", token: "proof" }));
  ctx.env.EMO_LINK.put = async () => { throw new Error("KV unavailable"); };
  await assert.rejects(createLink(ctx, () => "😀"), /KV unavailable/);
});
