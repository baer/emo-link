import { encodeUUIDAsEmoji } from "../emoji-id";

export { encodeUUIDAsEmoji };

/** @returns A URL-encoded versioned emoji key, without a leading slash. */
export function generateURISafeEmojiUUID(): string {
  return encodeURIComponent(encodeUUIDAsEmoji(crypto.randomUUID()));
}
