# EmoLink

A backendless, offline-capable, collision-free emoji-based URL shortener for the Edge.

Check out the [blog post](https://ericbaer.com/blog/emo-link) to learn more about how this works.

https://emol.ink/😻👩🏿‍🤝‍👨🏾👃🏾🛴👩🏾‍🎨🏍️🤷🏻‍♀🧑🏻‍🎨🧹🚚✋🏽

## Turnstile environments

Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` before building to select a site key.
The browser site key and the server's `TURNSTILE_SECRET` must belong to the
same widget. The public demo keys are for local development only.

For a local static build, pair the demo secret with:

```sh
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build
```

Production builds default to the production site key. Never serve a local
demo build in production. URL input accepts bare hosts and defaults to HTTPS.
