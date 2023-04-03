import { secretOptions } from "./constants";

export type SecretKeyType = (typeof secretOptions)[number]["value"];

export type WidgetStatus = "solved" | "error" | "expired" | "unknown";

type JSONValue =
    | string
    | number
    | boolean
    | { [x: string]: JSONValue }
    | Array<JSONValue>;

export interface JSONObject {
  [x: string]: JSONValue;
}