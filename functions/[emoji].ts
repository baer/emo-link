interface Env {
  EMO_LINK: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (
  context
): Promise<Response> => {
  const url = new URL(context.request.url);
  const { pathname } = url;

  let key = pathname;
  // Accept IRI or URIEncoded pathname
  if (!pathname.includes("%")) {
    key = decodeURIComponent(pathname);
  }

  const redirectURL = await context.env.EMO_LINK.get(key);

  console.log(pathname);
  console.log(key);
  console.log(redirectURL);

  if (!redirectURL) {
    return new Response(`📯 😢 Womp womp: '${pathname}' was not found.`, {
      status: 404,
    });
  }

  return Response.redirect(redirectURL, 301);
};
