# EmoLink

An emoji-based URL shortener with a Next.js static frontend, Cloudflare Worker,
and KV storage. Existing Pages deployments remain supported during the hosting
cutover.

[How EmoLink works](https://ericbaer.com/blog/emo-link)

## Development

Use Node 24, pinned through [mise](https://mise.jdx.dev/):

```sh
mise install
npm ci
npm run dev          # UI-only Next.js development server
```

For the complete app, build with the public demo site key and run Wrangler:

```sh
cp .dev.vars.example .dev.vars
npm run build:local
npm start
```

Wrangler serves `out/`, the API, and redirects with local KV storage. The example
secret is Cloudflare's public test secret. Never use demo keys for production.
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` selects the frontend key at build time; it must
match the server's `TURNSTILE_SECRET`. Production builds default to the production
site key. The form accepts bare hosts and defaults to HTTPS.

## Checks

```sh
npm run typecheck    # frontend, Pages adapters, and Worker
npm run lint
npm test            # Node's built-in TypeScript test runner
npm run generate-emoji-alphabet -- --check
npm run types:check
npm run build
```

`npm run types` regenerates Worker bindings and runtime types against the tracked
public example environment. Its output is independent of local `.dev.vars`.

## Production deployment

Use the **existing** `EMO_LINK` KV namespace so historical links remain available.
The zero namespace ID in `wrangler.jsonc` is a local-development placeholder.
The deployment script requires an explicit non-placeholder ID:

```sh
export EMO_LINK_KV_NAMESPACE_ID="YOUR_EXISTING_NAMESPACE_ID"
npm run deploy
```

Find the namespace ID in the Cloudflare dashboard or with `npx wrangler kv namespace list`. No namespace is created automatically by this command.

The first Worker deployment also needs the production Turnstile secret. Create a
JSON or dotenv secrets file outside the repository containing `TURNSTILE_SECRET`,
then provide its path:

```sh
export TURNSTILE_SECRETS_FILE="/secure/path/worker-secrets.json"
npm run deploy
```

The wrapper passes this file to Wrangler without reading or printing its values.
Later deployments can inherit the existing Worker's required secret. For a bundle
check without deployment, first build, then run:

```sh
node scripts/deploy-worker.mjs --dry-run
```

The namespace ID is still required for a dry run. A first-deployment dry run can
use `.dev.vars.example` as its secrets file; this must never be used for an actual
production deployment.

## Domain cutover and rollback

Deploy the Worker to its `workers.dev` preview URL first, using the existing KV
namespace and the production secret. Verify static assets, creation, temporary
redirects, unknown links, and representative historical links. Turnstile's
production widget must allow the hostname used for browser verification.

Move `emol.ink` to the Worker only after these checks pass. The checked-in config
does not change DNS or custom domains. Preserve the current Pages deployment,
bindings, and domain settings for rollback; Pages adapters and their typecheck
remain in this repository until the live cutover is verified.

If cutover fails, restore the previous Pages domain mapping and deployment. Both
hosts use the same KV keys and destination format, including newly created v2
links, so rollback does not require rewriting link data. Links already cached as
301 redirects by older clients cannot be revoked by changing server code.

Worker creation logs contain only the event name and key. Automatic invocation
logs are disabled and query-string redaction is enabled. Destination URLs and
client IP addresses are not added to creation records.

## Emoji keys

New keys have the form `v2-` followed by eleven Unicode 17 emoji tokens separated
by `~`. The version prefix separates them from historical keys, and separators
make token boundaries unambiguous. The addressable alphabet order is pinned;
future alphabet changes require a new version. Historical keys are looked up
literally and do not depend on the current alphabet.
