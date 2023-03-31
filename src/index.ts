import { encodeUUIDAsEmoji } from "./emoji-id";

export interface Env {
  EMO_LINK: KVNamespace;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/") {
      const uuid = crypto.randomUUID();
      const uuidAsEmoji = encodeUUIDAsEmoji(uuid);
      const uriEncodedEmojiUUID = encodeURIComponent(uuidAsEmoji);

      const html = `<!DOCTYPE html>
        <body>
          <h1>EmoLink</h1>
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
    }

    const key = decodeURIComponent(pathname);
    const redirectURL = await env.EMO_LINK.get(key);

    if (!redirectURL) {
      return new Response(`📯 😢 Womp womp: '${pathname}' was not found.`, {
        status: 404,
      });
    }

    return Response.redirect(redirectURL, 301);
  },
};
