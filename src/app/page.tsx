"use client";

import styles from "./page.module.css";

import { useEffect, useState } from "react";
import { Turnstile, TurnstileProps } from "@marsidev/react-turnstile";
import { WidgetStatus, JSONObject } from "../types";
import { TURNSTILE_SITEKEYS, CREATE_LINK_ENDPOINT } from "../constants";
import emojiAlphabet from "../emoji-alphabet.json";
import SmallUntilHover from "./small-until-hover";

function generateRandomNumbers(n: number, min: number, max: number): number[] {
  return Array.from(new Array(n), () =>
    Math.floor(Math.random() * (max - min + 1) + min)
  );
}

// The appearance option was added to the code as of v0.1.0 but the Type
// definitions were not updated accordingly. This hack is in place until that's
// fixed.
// https://github.com/marsidev/react-turnstile/releases/tag/v0.1.0
const TurnstileWithAppearance = Turnstile as React.ComponentType<
  TurnstileProps & { appearance: string }
>;

const siteKey =
  process.env.NODE_ENV === "development"
    ? // Can be changed to pass, fail, and interactive
      TURNSTILE_SITEKEYS["pass"]
    : TURNSTILE_SITEKEYS["production"];

const getEmojiURL = (key: string | null): string | null =>
  key && typeof window !== "undefined"
    ? `${window.location.origin}${key}`
    : null;

export default function Home() {
  const [randomEmojis, setRandomEmojis] = useState<string[]>([]);

  const [status, setStatus] = useState<WidgetStatus>("unknown");
  const [token, setToken] = useState<string>("");
  const canSubmit = status === "solved" && token !== "";
  const [userURL, setUserURL] = useState("");

  const [response, setResponse] = useState<JSONObject | null>(null);
  const [loading, setLoading] = useState(false);
  const showResult = response && !loading;
  const [isCopied, setIsCopied] = useState(false);
  const emojiURL = getEmojiURL(response?.key as string);

  useEffect(() => {
    const emojisToGenerate = 40;
    setRandomEmojis(
      generateRandomNumbers(emojisToGenerate, 0, emojiAlphabet.length).map(
        (randomNumber) => emojiAlphabet[randomNumber]
      )
    );
  }, []);

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

  function handleClickLink() {
    navigator.clipboard.writeText(emojiURL ?? "");
    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 4000);
  }

  return (
    <>
      {showResult && (
        <>
          <div
            className={`${styles["short-url__copied-indicator"]} ${
              isCopied ? styles["short-url__copied-indicator--visible"] : ""
            }`}
          >
            Copied to Clipboard!
          </div>
          <div className={styles["short-url"]} onClick={handleClickLink}>
            {emojiURL}
          </div>
        </>
      )}

      <section className={styles.hero}>
        <div className={styles["hero__emoji-container"]}>
          <p>
            {randomEmojis.map((emoji, index) => (
              <SmallUntilHover key={index}>{emoji}</SmallUntilHover>
            ))}
          </p>
        </div>
        <div className={styles["hero__form-container"]}>
          <div>
            <label
              id="url-input-label"
              htmlFor="url"
              className={styles["visually-hidden"]}
            >
              URL to shorten
            </label>
            <input
              className={styles["hero__form-url-input"]}
              required
              type="url"
              id="url"
              name="url"
              placeholder="http://ericbaer.com/"
              aria-describedby="url-input-label"
              value={userURL}
              onChange={(event) => {
                setUserURL(event.target.value);
              }}
            />

            <label
              id="turnstile-label"
              className={styles["hero__turnstile-label"]}
              htmlFor="cf-turnstile"
            >
              Anti 🤖 Check
            </label>
            <TurnstileWithAppearance
              aria-describedby="turnstile-label"
              appearance="interaction-only"
              className={styles["hero__turnstile"]}
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
              className={styles["hero__form-submit-button"]}
              onClick={handleSubmitURL}
              disabled={!canSubmit || loading}
            >
              Submit
            </button>
          </div>
        </div>
      </section>

      <article className={styles.info}>
        <p>
          To learn how and why this works, check out my{" "}
          <a
            href="https://ericbaer.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            blog post
          </a>
          .
        </p>
      </article>
    </>
  );
}
