import { isRecord, parseLinkRequestBody, type LinkCreatedResponse } from "../api.ts";
import { VERIFY_TURNSTILE_TOKEN_ENDPOINT } from "../constants.ts";
import { normalizeURL } from "../url.ts";
import { ErrorCodes, errorResponse, jsonResponse } from "./response.ts";

type CreateLinkContext = {
  request: { json(): Promise<unknown> };
  env: {
    EMO_LINK: { put(key: string, value: string): Promise<void> };
    TURNSTILE_SECRET?: string;
  };
};

async function validateTurnstileToken(
  secret: string,
  token: string
): Promise<boolean> {
  try {
    const response = await fetch(VERIFY_TURNSTILE_TOKEN_ENDPOINT, {
      method: "POST",
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    if (!response.ok) return false;

    const outcome: unknown = await response.json();
    return isRecord(outcome) && outcome.success === true;
  } catch {
    return false;
  }
}

export async function createLink(
  context: CreateLinkContext,
  encodeUUIDAsEmoji: (uuid: string) => string
): Promise<Response> {
  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return errorResponse(ErrorCodes.INVALID_URL);
  }

  const { url, token } = parseLinkRequestBody(body);
  if (!url) {
    return errorResponse(ErrorCodes.INVALID_URL);
  }
  const urlWithProtocol = normalizeURL(url);
  if (!urlWithProtocol) return errorResponse(ErrorCodes.INVALID_URL);

  const secret = context.env.TURNSTILE_SECRET;
  if (
    typeof secret !== "string" ||
    !secret.trim() ||
    typeof token !== "string" ||
    !token.trim() ||
    !(await validateTurnstileToken(secret, token))
  ) {
    return errorResponse(ErrorCodes.INVALID_TURNSTILE_TOKEN);
  }

  const uuid = crypto.randomUUID();
  const uuidAsEmoji = encodeUUIDAsEmoji(uuid);
  const key = `/${uuidAsEmoji}`;
  await context.env.EMO_LINK.put(key, urlWithProtocol);

  return jsonResponse({
    data: { key } satisfies LinkCreatedResponse,
  });
}
