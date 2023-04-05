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

    setLoading(false);
    setResponse(data);
  }

  return (
    <main role="main">
      {response && !loading && (
        <div className={styles["shortened-url-result"]}>
          <a
            href={getEmojiURL(response.key as string)}
            className={styles["large-link"]}
          >
            {getEmojiURL(response.key as string)}
          </a>
        </div>
      )}

      <div className={styles.hero}>
        <div className={styles["hero-image-wrapper"]}>
          <img
            src="https://picsum.photos/485/244"
            alt="stock photo"
            className={styles["hero-image"]}
          />
        </div>
        <div className={styles["hero-content"]}>
          <div className={styles.form}>
            <label
              id="url-input-label"
              htmlFor="url"
              className={styles["visually-hidden"]}
            >
              URL to shorten
            </label>
            <input
              className={styles["input-url"]}
              type="url"
              id="url"
              name="url"
              placeholder="http://www.google.com"
              aria-describedby="url-input-label"
              value={userURL}
              onChange={(event) => {
                setUserURL(event.target.value);
              }}
            />
            <Turnstile
              className={styles.turnstile}
              ref={turnstileRef}
              siteKey={siteKey}
              onError={() => setStatus("error")}
              onExpire={() => setStatus("expired")}
              onSuccess={(token) => {
                setToken(token);
                setStatus("solved");
              }}
            />
            <button
              aria-label="Shorten URL"
              className={styles["button-submit"]}
              onClick={handleSubmitURL}
              disabled={!canSubmit || loading}
            >
              Shorten
            </button>
          </div>
        </div>
      </div>

      <div className={styles.info}>
        This is weird. To learn how this works, check out{" "}
        <a
          href="https://ericbaer.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          my blog post
        </a>
        .
      </div>
    </main>
  );
}
