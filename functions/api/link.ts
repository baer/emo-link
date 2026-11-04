import { encodeUUIDAsEmoji } from "../../src/server/emoji-id";
import { createLink } from "../../src/server/create-link.ts";

interface Env {
  EMO_LINK: KVNamespace;
  TURNSTILE_SECRET?: string;
}

export const onRequestPost: PagesFunction<Env> = (context): Promise<Response> =>
  createLink(context, encodeUUIDAsEmoji);
