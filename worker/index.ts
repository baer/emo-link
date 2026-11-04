import { encodeUUIDAsEmoji } from "../src/emoji-id.ts";
import { createLink } from "../src/server/create-link.ts";
import { ErrorCodes, errorResponse } from "../src/server/response.ts";
import { parseHTTPURL } from "../src/url.ts";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/link") {
      if (request.method !== "POST") {
        return Response.json({ message: "Method Not Allowed" }, {
          status: 405,
          headers: { allow: "POST" },
        });
      }
      const response = await createLink({ request, env }, encodeUUIDAsEmoji);
      if (response.ok) {
        const { key }: { key: string } = await response.clone().json();
        // Destinations may contain credentials and private query parameters.
        console.log(JSON.stringify({ event: "link.created", key }));
      }
      return response;
    }

    // Asset requests normally bypass this handler; forward direct invocations.
    if (pathname === "/" || pathname.slice(1).includes("/")) {
      return env.ASSETS.fetch(request);
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return Response.json({ message: "Method Not Allowed" }, {
        status: 405,
        headers: { allow: "GET, HEAD" },
      });
    }

    let key: string;
    try {
      key = decodeURIComponent(pathname);
    } catch {
      return errorResponse(ErrorCodes.NOT_FOUND, 404);
    }
    // KV limits keys to 512 bytes. Oversized unknown paths are missing links.
    if (new TextEncoder().encode(key).byteLength > 512) {
      return errorResponse(ErrorCodes.NOT_FOUND, 404);
    }
    const stored = await env.EMO_LINK.get(key);
    const target = stored ? parseHTTPURL(stored) : null;
    if (target) {
      return new Response(null, {
        status: 302,
        headers: { location: target, "cache-control": "no-store" },
      });
    }
    if (stored) return errorResponse(ErrorCodes.NOT_FOUND, 404);
    const asset = await env.ASSETS.fetch(request);
    return asset.status === 404
      ? errorResponse(ErrorCodes.NOT_FOUND, 404)
      : asset;
  },
} satisfies ExportedHandler<Env>;
