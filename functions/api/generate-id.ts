import { jsonResponse } from "../../src/server/response";
import { encodeUUIDAsEmoji } from "../../src/server/emoji-id";

interface Env {
  EMO_LINK: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (
  context
): Promise<Response> => {
  const uuid = crypto.randomUUID();
  const uuidAsEmoji = encodeUUIDAsEmoji(uuid);
  const uriEncodedEmojiUUID = encodeURIComponent(uuidAsEmoji);

  return jsonResponse({
    data: {
      uuid,
      uuidAsEmoji,
      uriEncodedEmojiUUID,
    },
    prettyPrint: true,
  });
};
