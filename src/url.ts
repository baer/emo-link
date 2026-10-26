function parseURL(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function httpHref(url: URL | null): string | null {
  return url && (url.protocol === "http:" || url.protocol === "https:")
    ? url.href
    : null;
}

/** Validates an absolute destination, including values written by older versions. */
export function parseHTTPURL(input: string): string | null {
  return httpHref(parseURL(input));
}

/** Accepts user-typed HTTP(S) destinations, defaulting bare hosts to HTTPS. */
export function normalizeURL(input: string): string | null {
  const parsed = parseURL(input);
  if (parsed) return httpHref(parsed);

  // A malformed explicit scheme must not become an unrelated HTTPS hostname.
  const schemeInput = input.trim().replace(/[\t\n\r]/g, "");
  if (/^[a-z][a-z\d+.-]*:/i.test(schemeInput)) return null;
  return httpHref(parseURL(`https://${input}`));
}
