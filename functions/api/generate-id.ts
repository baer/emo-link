import { encodeUUIDAsEmoji } from "../../src/function-src/emoji-id";

interface Env {
  EMO_LINK: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (
  context
): Promise<Response> => {
  const uuid = crypto.randomUUID();
  const uuidAsEmoji = encodeUUIDAsEmoji(uuid);
  const uriEncodedEmojiUUID = encodeURIComponent(uuidAsEmoji);

  const json = JSON.stringify(
    {
      uuid,
      uuidAsEmoji,
      uriEncodedEmojiUUID,
    },
    null,
    2
  );
  return new Response(json, {
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
  });
};
