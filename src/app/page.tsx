"use client";

import styles from "./page.module.css";

import { useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { WidgetStatus, JSONObject } from "../types";
import { TURNSTILE_SITEKEYS, CREATE_LINK_ENDPOINT } from "../constants";

const siteKey =
  process.env.NODE_ENV === "development"
    ? // Can be changed to pass, fail, and interactive
      TURNSTILE_SITEKEYS["pass"]
    : TURNSTILE_SITEKEYS["production"];

function getEmojiURL(key: string) {
  return `${location.origin}${key}`;
}

export default function Home() {
  const [status, setStatus] = useState<WidgetStatus>("unknown");
  const [token, setToken] = useState<string>("");
  const canSubmit = status === "solved" && token !== "";
  const [userURL, setUserURL] = useState("");

  const [response, setResponse] = useState<JSONObject | null>(null);
  const [loading, setLoading] = useState(false);

  const turnstileRef = useRef<TurnstileInstance>(null);

  async function handleSubmitURL() {
    setLoading(true);
    setResponse(null);

    const res = await fetch(CREATE_LINK_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ token, url: userURL }),
      headers: { "content-type": "application/json" },
    });

    const data = await res.json();
    console.log({ data });

    setLoading(false);
    setResponse(data);
  }

  return (
    <main className={`${styles.main}`}>
      <h1>EmoLink</h1>

      <div>
        <label htmlFor="url">URL</label>
        <input
          type="text"
          id="url"
          value={userURL}
          onChange={(event) => {
            setUserURL(event.target.value);
          }}
        />

        <button disabled={!canSubmit || loading} onClick={handleSubmitURL}>
          {loading ? `Loading...` : `Submit`}
        </button>
      </div>

      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        onError={() => setStatus("error")}
        onExpire={() => setStatus("expired")}
        onSuccess={(token) => {
          setToken(token);
          setStatus("solved");
        }}
      />

      <div>
        {response && !loading && (
          <div className="result">
            <a href={getEmojiURL(response.key as string)} target="_blank">
              {getEmojiURL(response.key as string)}
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

// Broken
// https://emo-link.pages.dev/🧏‍♀️🤹‍♀🚷🤽🏾👮🏾🧕🏼👂🏼👈🏾👨🏼‍❤️‍👨🏻💁🏽😋'

// Working
// https://emo-link.pages.dev/😻👩🏿‍🤝‍👨🏾👃🏾🛴👩🏾‍🎨🏍️🤷🏻‍♀🧑🏻‍🎨🧹🚚✋🏽
