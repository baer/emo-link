import { encodeUUIDAsEmoji } from "./emoji-id";
import { getHomePage, getDemo } from "./html-templates";

export interface Env {
  EMO_LINK: KVNamespace;
}

// TODO: Use env
// Cloudflare dev keys
const SECRET_KEY = "1x0000000000000000000000000000000AA";
const SITE_KEY = "1x00000000000000000000AA";

async function handlePost(env: Env, request: Request) {
  const body = await request.formData();

  const token = body.get("cf-turnstile-response") || "";
  const ip = request.headers.get("CF-Connecting-IP") || "";

  // Validate the token by calling the "/siteverify" API.
  let formData = new FormData();
  formData.append("secret", SECRET_KEY);
  formData.append("response", token);
  formData.append("remoteip", ip);

  const result = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      body: formData,
      method: "POST",
    }
  );

  const outcome = await result.json();
  if (!outcome.success) {
    // TODO: Figure out Error handling
    return new Response(
      "The provided Turnstile token was not valid! \n" + JSON.stringify(outcome)
    );
  }

  // TODO: Error handling
  // TODO: Validation
  const url = body.get("url") || "";
  const { uuid, uuidAsEmoji, uriEncodedEmojiUUID } = getEncodedUUID();
  const key = `/${uuidAsEmoji}`;

  // "This method returns a Promise that you should await on in order to verify
  // a successful update."
  // https://developers.cloudflare.com/workers/runtime-apis/kv/
  const successfullInsert = await env.EMO_LINK.put(key, url);

  const json = JSON.stringify(
    {
      uuid,
      uuidAsEmoji,
      uriEncodedEmojiUUID,
      key,
    },
    null,
    2
  );
  return new Response(json, {
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
  });
}

function getEncodedUUID() {
  const uuid = crypto.randomUUID();
  const uuidAsEmoji = encodeUUIDAsEmoji(uuid);
  const uriEncodedEmojiUUID = encodeURIComponent(uuidAsEmoji);

  return {
    uuid,
    uuidAsEmoji,
    uriEncodedEmojiUUID,
  };
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    // TODO: Restrict to path
    if (request.method === "POST") {
      return await handlePost(env, request);
    }

    if (pathname === "/") {
      const { uuid, uuidAsEmoji, uriEncodedEmojiUUID } = getEncodedUUID();
      const body = getDemo(uuid, uuidAsEmoji, uriEncodedEmojiUUID);
      return new Response(body, {
        headers: {
          "content-type": "text/html;charset=UTF-8",
        },
      });
    }

    if (pathname === "/turnstile") {
      const body = getHomePage(SITE_KEY);
      return new Response(body, {
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
