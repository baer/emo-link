import { encodeUUIDAsEmoji, generateURISafeEmojiUUID } from "./emoji-id";

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  //
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const uuid = crypto.randomUUID();
    const uuidAsEmoji = encodeUUIDAsEmoji(uuid);
    const uriEncodedEmojiUUID = encodeURIComponent(uuidAsEmoji);

    const html = `<!DOCTYPE html>
      <body>
        <h1>EmoShort</h1>
        <p>UUID: ${uuid}</p>
        <p>Emoji: ${uuidAsEmoji}</p>
        <p>URI Encoded: ${uriEncodedEmojiUUID}</p>
      </body>
    `;

    return new Response(html, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    });
  },
};
