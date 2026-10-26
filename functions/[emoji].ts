import { ErrorCodes, errorResponse } from "../src/server/response.ts";
import { parseHTTPURL } from "../src/url.ts";

interface Env {
  EMO_LINK: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (
  context
): Promise<Response> => {
  const { pathname } = new URL(context.request.url);

  let key: string;
  try {
    // Accept IRI or URIEncoded pathname, without allowing malformed encodings.
    key = decodeURIComponent(pathname);
  } catch {
    return errorResponse(ErrorCodes.NOT_FOUND, 404);
  }

  const storedURL = await context.env.EMO_LINK.get(key);
  const redirectURL = storedURL ? parseHTTPURL(storedURL) : null;
  return redirectURL
    ? new Response(null, {
        status: 302,
        headers: { Location: redirectURL, "Cache-Control": "no-store" },
      })
    : errorResponse(ErrorCodes.NOT_FOUND, 404);
};
