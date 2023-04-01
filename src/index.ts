import { encodeUUIDAsEmoji } from "./emoji-id";
import { getHomePage, getDemo } from "./html-templates";

export interface Env {
  EMO_LINK: KVNamespace;
}

// This is the demo secret key. In prod, we recommend you store
// your secret key(s) safely.
const SECRET_KEY = "1x0000000000000000000000000000000AA";
const SITE_KEY = "1x00000000000000000000AA";

async function handlePost(request: Request) {
  const body = await request.formData();
  // Turnstile injects a token in "cf-turnstile-response".
  const token = body.get("cf-turnstile-response");
  const ip = request.headers.get("CF-Connecting-IP");

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
    return new Response(
      "The provided Turnstile token was not valid! \n" + JSON.stringify(outcome)
    );
  }
  // The Turnstile token was successfuly validated. Proceed with your application logic.
  // Validate login, redirect user, etc.
  // For this demo, we just echo the "/siteverify" response:
  const json = JSON.stringify(outcome, null, 2);
  return new Response(json, {
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
  });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === "POST") {
      return await handlePost(request);
    }

    if (pathname === "/") {
      const uuid = crypto.randomUUID();
      const uuidAsEmoji = encodeUUIDAsEmoji(uuid);
      const uriEncodedEmojiUUID = encodeURIComponent(uuidAsEmoji);

      const body = getDemo(uuid, uuidAsEmoji, uriEncodedEmojiUUID);
      return new Response(body, {
        headers: {
          "content-type": "text/html;charset=UTF-8",
        },
      });
    }

    if (pathname === "/turnstyle") {
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
