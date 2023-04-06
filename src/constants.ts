export const secretOptions = [
  { label: "Always pass", value: "pass" },
  { label: "Always fail", value: "fail" },
  { label: '"Token already spent" error', value: "spent" },
] as const;

export enum TURNSTILE_SITEKEYS {
  pass = "1x00000000000000000000AA",
  fail = "2x00000000000000000000AB",
  interactive = "3x00000000000000000000FF",
  passInvisible = "1x00000000000000000000BB",
  failInvisible = "2x00000000000000000000BB",
  pages = "0x4AAAAAAADuk13L1j1kSUhb",
  production = "0x4AAAAAAADqvMFKDAPy1IkK",
}

export enum TURNSTILE_DEMO_SECRETS {
  pass = "1x0000000000000000000000000000000AA",
  fail = "2x0000000000000000000000000000000AA",
  spent = "3x0000000000000000000000000000000AA",
}

export const CREATE_LINK_ENDPOINT = "/api/link";
export const VERIFY_TURNSTILE_TOKEN_ENDPOINT =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
