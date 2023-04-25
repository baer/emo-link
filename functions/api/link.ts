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

function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

async function validateTurnstileToken(
  secret: string,
  token: string
): Promise<boolean> {
  const response = await fetch(VERIFY_TURNSTILE_TOKEN_ENDPOINT, {
    method: "POST",
    body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(
      token
    )}`,
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
  const outcome = (await response.json()) as JSONObject;

  return !!outcome.success;
}

export const onRequestPost: PagesFunction<Env> = async (
  context
): Promise<Response> => {
  const { token, url }: { token: string; url: string } =
    await context.request.json();

  // The JavaScipt URL interface requires a protocol, but users commonly type
  // in URLs without one. Attempt to validate the input directly; if it fails,
  // do what Google does and append a default protocol.
  // https://blog.chromium.org/2021/03/a-safer-default-for-navigation-https.html
  const isValidURL = validateURL(url) || validateURL("https://" + url);

  console.log(url);
  console.log(validateURL(url));
  console.log(validateURL("https://" + url));
  console.log(isValidURL);

  if (!isValidURL) {
    return errorResponse(ErrorCodes.INVALID_URL);
  }

  const secret = context.env.TURNSTILE_SECRET || TURNSTILE_DEMO_SECRETS["pass"];
  if (!(await validateTurnstileToken(secret, token))) {
    return errorResponse(ErrorCodes.INVALID_TURNSTILE_TOKEN);
  }

  const uuid = crypto.randomUUID();
  const uuidAsEmoji = encodeUUIDAsEmoji(uuid);
  const uriEncodedEmojiUUID = encodeURIComponent(uuidAsEmoji);
  const key = `/${uuidAsEmoji}`;

  // "This method returns a Promise that you should await on in order to verify
  // a successful update."
  // https://developers.cloudflare.com/workers/runtime-apis/kv/
  await context.env.EMO_LINK.put(key, url);

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
