import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const namespace = process.env.EMO_LINK_KV_NAMESPACE_ID;
if (!namespace || !/^[0-9a-f]{32}$/i.test(namespace) || /^0+$/.test(namespace)) {
  console.error("Set EMO_LINK_KV_NAMESPACE_ID to the existing link namespace ID before deploying.");
  process.exit(1);
}
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--dry-run")) {
  console.error("Only --dry-run is supported by this deploy command.");
  process.exit(1);
}

const root = fileURLToPath(new URL("../", import.meta.url));
const config = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
config.main = join(root, config.main);
config.assets.directory = join(root, config.assets.directory);
config.kv_namespaces[0].id = namespace;
const secretsFile = process.env.TURNSTILE_SECRETS_FILE;
const secretArgs = secretsFile ? ["--secrets-file", resolve(root, secretsFile)] : [];
const directory = mkdtempSync(join(tmpdir(), "emo-link-deploy-"));
try {
  const path = join(directory, "wrangler.json");
  writeFileSync(path, JSON.stringify(config));
  const result = spawnSync(process.execPath, [
    join(root, "node_modules/wrangler/bin/wrangler.js"),
    "deploy", "--config", path, ...secretArgs, ...args,
  ], { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
