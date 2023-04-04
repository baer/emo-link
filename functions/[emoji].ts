import { ErrorCodes, errorResponse } from "../src/server/response";

interface Env {
  EMO_LINK: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (
  context
): Promise<Response> => {
  const { pathname } = new URL(context.request.url);

  const redirectURL = await context.env.EMO_LINK.get(
    // Accept IRI or URIEncoded pathname
    decodeURIComponent(pathname)
  );

  return redirectURL
    ? Response.redirect(redirectURL, 301)
    : errorResponse(ErrorCodes.NOT_FOUND, 404);
};
