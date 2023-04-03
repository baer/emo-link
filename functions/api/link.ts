import { encodeUUIDAsEmoji } from "../../src/function-src/emoji-id";
import response from "../../src/function-src/response";
import { JSONObject } from "../../src/types";

import { TURNSTILE_DEMO_SECRET } from "../../src/constants";

const verifyEndpoint =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface Env {
  EMO_LINK: KVNamespace;
  TURNSTILE_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async (
  context
): Promise<Response> => {
  const body = (await context.request.json()) as { token: string; url: string };
  const token = body.token;

  let userURL;
  try {
    userURL = new URL(body.url);
  } catch (error) {
    // TODO: Formalize error codes
    return response.json(
      {
        code: "001",
        messsge: "Invalid URL",
      },
      400
    );
  }

  const SECRET = context.env.TURNSTILE_SECRET || TURNSTILE_DEMO_SECRET["pass"];

  const outcome = (await fetch(verifyEndpoint, {
    method: "POST",
    body: `secret=${encodeURIComponent(SECRET)}&response=${encodeURIComponent(
      token
    )}`,
    headers: { "content-type": "application/x-www-form-urlencoded" },
  }).then((res) => res.json())) as JSONObject;

  if (!outcome.success) {
    return response.json(
      {
        code: "002",
        message: "Unable to verify Turnstile token",
        ...outcome,
      },
      400
    );
  }

  const uuid = crypto.randomUUID();
  const uuidAsEmoji = encodeUUIDAsEmoji(uuid);
  const uriEncodedEmojiUUID = encodeURIComponent(uuidAsEmoji);
  const key = `/${uuidAsEmoji}`;

  // "This method returns a Promise that you should await on in order to verify
  // a successful update."
  // https://developers.cloudflare.com/workers/runtime-apis/kv/
  await context.env.EMO_LINK.put(key, userURL.href);

  return response.json({
    uuid,
    uuidAsEmoji,
    uriEncodedEmojiUUID,
    key,
  });
};
