import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const script = fileURLToPath(new URL("../scripts/deploy-worker.mjs", import.meta.url));
test("deployment requires an explicit non-placeholder production namespace", () => {
  for (const value of ["", "00000000000000000000000000000000", "bad-id"]) {
    const result = spawnSync(process.execPath, [script, "--dry-run"], {
      env: { ...process.env, EMO_LINK_KV_NAMESPACE_ID: value }, encoding: "utf8",
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /existing link namespace ID/);
  }
});

test("deployment does not accept flags that could bypass its config", () => {
  const result = spawnSync(process.execPath, [script, "--config", "other.json"], {
    env: { ...process.env, EMO_LINK_KV_NAMESPACE_ID: "11111111111111111111111111111111" }, encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Only --dry-run/);
});
