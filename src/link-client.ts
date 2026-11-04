import { parseLinkResponse, type LinkResponse } from "./api.ts";

const UNEXPECTED_ERROR = { message: "Something went wrong — please try again." };

/** Encode the path segment so alphabet characters such as # survive navigation. */
export function getShortLinkURL(origin: string, key: string): string {
  return `${origin}/${encodeURIComponent(key.slice(1))}`;
}

/** Keep emoji readable while ensuring a manually copied display URL is also valid. */
export function getShortLinkDisplayURL(origin: string, key: string): string {
  return `${origin}${key.replace(/[%?#]/g, encodeURIComponent)}`;
}

export async function submitLink(url: string, token: string): Promise<LinkResponse> {
  try {
    const response = await fetch("/api/link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, token }),
    });
    const parsed = parseLinkResponse(await response.json());
    if (!parsed || (!response.ok && "key" in parsed)) return UNEXPECTED_ERROR;
    return parsed;
  } catch {
    return UNEXPECTED_ERROR;
  }
}

/** Each attempt may consume the challenge, including failed persistence or delivery. */
export async function submitWithChallenge<T>(
  submit: () => Promise<T>,
  reset: () => void
): Promise<T> {
  try {
    return await submit();
  } finally {
    reset();
  }
}
