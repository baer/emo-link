import { encodeUUIDAsEmoji } from "../../src/server/emoji-id";
import {
  jsonResponse,
  errorResponse,
  ErrorCodes,
} from "../../src/server/response";
import { JSONObject } from "../../src/types";
import {
  TURNSTILE_DEMO_SECRETS,
  VERIFY_TURNSTILE_TOKEN_ENDPOINT,
} from "../../src/constants";

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
    return errorResponse(ErrorCodes.INVALID_URL);
  }

  const SECRET = context.env.TURNSTILE_SECRET || TURNSTILE_DEMO_SECRETS["pass"];

  const outcome = (await fetch(VERIFY_TURNSTILE_TOKEN_ENDPOINT, {
    method: "POST",
    body: `secret=${encodeURIComponent(SECRET)}&response=${encodeURIComponent(
      token
    )}`,
    headers: { "content-type": "application/x-www-form-urlencoded" },
  }).then((res) => res.json())) as JSONObject;

  if (!outcome.success) {
    return errorResponse(ErrorCodes.INVALID_TURNSTILE_TOKEN);
  }

  const uuid = crypto.randomUUID();
  const uuidAsEmoji = encodeUUIDAsEmoji(uuid);
  const uriEncodedEmojiUUID = encodeURIComponent(uuidAsEmoji);
  const key = `/${uuidAsEmoji}`;

  // "This method returns a Promise that you should await on in order to verify
  // a successful update."
  // https://developers.cloudflare.com/workers/runtime-apis/kv/
  await context.env.EMO_LINK.put(key, userURL.href);

  return jsonResponse({
    data: {
      uuid,
      uuidAsEmoji,
      uriEncodedEmojiUUID,
      key,
    },
    prettyPrint: true,
  });
};
