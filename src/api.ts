/**
 * Wire types for POST /api/link, shared by the server and client.
 */

/** Success: `key` is the emoji path of the newly created short link. */
export interface LinkCreatedResponse {
  key: string;
}

/** Failure: a human-readable explanation. */
export interface ApiErrorResponse {
  message: string;
}

export type LinkResponse = LinkCreatedResponse | ApiErrorResponse;

/** What the client sends when creating a link. */
export interface LinkRequestBody {
  token?: string;
  url?: string;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Drop mistyped request fields before server validation. */
export function parseLinkRequestBody(value: unknown): LinkRequestBody {
  if (!isRecord(value)) {
    return {};
  }
  return {
    token: typeof value.token === "string" ? value.token : undefined,
    url: typeof value.url === "string" ? value.url : undefined,
  };
}

/** Reject response shapes that the client cannot render or navigate. */
export function parseLinkResponse(value: unknown): LinkResponse | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.key === "string" &&
    value.key.startsWith("/") &&
    value.key.length > 1 &&
    !value.key.slice(1).includes("/") &&
    !value.key.includes("\\") &&
    !Array.from(value.key).some((char) => {
      const code = char.codePointAt(0)!;
      return code <= 0x20 || code === 0x7f;
    }) &&
    value.key !== "/." && value.key !== "/.."
  ) {
    return { key: value.key };
  }
  if (typeof value.message === "string") {
    return { message: value.message };
  }
  return null;
}
