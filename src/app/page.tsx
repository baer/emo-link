"use client";

import styles from "./page.module.css";

import { useEffect, useState } from "react";
import { Turnstile, TurnstileProps } from "@marsidev/react-turnstile";
import { WidgetStatus, JSONObject } from "../types";
import { TURNSTILE_SITEKEYS, CREATE_LINK_ENDPOINT } from "../constants";
import emojiAlphabet from "../emoji-alphabet.json";
import SmallUntilHover from "./small-until-hover";
import joinClasses from "../util/join-classes";

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
  const [isCopied, setIsCopied] = useState(false);
  const emojiURL = getEmojiURL(response?.key as string);
  // const emojiURL = "https://emol.ink/😻👩🏿‍🤝‍👨🏾👃🏾🛴👩🏾‍🎨🏍️🤷🏻‍♀🧑🏻‍🎨🧹🚚✋🏽";

  useEffect(() => {
    const emojisToGenerate = 20;
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
    <div>
      <div
        className={joinClasses([
          styles["short-url__copied-indicator"],
          ...(isCopied ? [styles["short-url__copied-indicator--visible"]] : []),
          "text-base",
          "text-white",
          "text-center",
          "mb-1",
          "lg:mb-4",
          "mx-12",
        ])}
      >
        Copied to Clipboard!
      </div>
      <div
        className={joinClasses([
          styles["short-url"],
          "mb-2",
          "md:mb-10",
          "w-full",
          "no-underline",
          "text-center",
          "font-bold",
          "text-base",
          "md:text-2xl",
          "lg:text-4xl",
        ])}
        onClick={handleClickLink}
      >
        {emojiURL}
      </div>

      <section
        className={joinClasses([
          "text-gray-600",
          "body-font",
          "shadow-md",
          "rounded-lg",
          "container",
          "bg-white",
          "flex-col",
          "flex",
          "items-center",
          "md:flex-row",
          "mx-auto",
          "p-4",
        ])}
      >
        <div className="h-40 md:h-auto lg:max-w-lg lg:w-full md:w-1/2 w-5/6 mb-2 md:mb- text-center">
          <p>
            {randomEmojis.map((emoji, index) => (
              <SmallUntilHover key={index}>{emoji}</SmallUntilHover>
            ))}
          </p>
        </div>

        <div
          className={joinClasses([
            "flex",
            "flex-col",
            "items-center",
            "text-center",
            "lg:flex-grow",
            "lg:pl-24",
            "md:items-start",
            "md:pl-16",
            "md:text-left",
            "md:w-1/2",
            "md:gap-8",
          ])}
        >
          <div className="p-2 w-full">
            <div className="relative">
              <label
                id="url-input-label"
                htmlFor="url"
                className={styles["visually-hidden"]}
              >
                URL to shorten
              </label>
              <input
                required
                type="url"
                id="url"
                name="url"
                placeholder="https://ericbaer.com/"
                aria-describedby="url-input-label"
                value={userURL}
                onChange={(event) => {
                  setUserURL(event.target.value);
                }}
                className={joinClasses([
                  styles["hero__form-url-input"],
                  "bg-gray-100",
                  "bg-opacity-50",
                  "duration-200",
                  "ease-in-out",
                  "focus:bg-white",
                  "leading-8",
                  "px-3",
                  "py-1",
                  "shadow-md",
                  "text-base",
                  "text-gray-700",
                  "transition-colors",
                  "w-full",
                ])}
              />
            </div>
          </div>

          <div className="bg-gray-100 rounded my-4 p-2">
            <label
              id="turnstile-label"
              htmlFor="cf-turnstile"
              className="inline-block w-full text-center"
            >
              Anti 🤖 Check
            </label>
            <TurnstileWithAppearance
              aria-describedby="turnstile-label"
              appearance="interaction-only"
              siteKey={siteKey}
              onError={() => setStatus("error")}
              onExpire={() => setStatus("expired")}
              onSuccess={(token) => {
                setToken(token);
                setStatus("solved");
              }}
            />
          </div>

          <button
            aria-label="Shorten URL"
            onClick={handleSubmitURL}
            disabled={!canSubmit || loading}
            className={joinClasses([
              styles["hero__form-submit-button"],
              "w-full",
              "shadow-md",
              "border-0",
              "py-2",
              "px-6",
              "focus:outline-none",
              "text-lg",
              "uppercase",
              "font-bold",
            ])}
          >
            Submit
          </button>
        </div>
      </section>

      <article
        className={joinClasses([
          "mt-4",
          "text-md",
          "font-medium",
          "text-center",
        ])}
      >
        <p>
          To learn how and why this works, check out my{" "}
          <a
            className="m-0"
            href="https://ericbaer.com/blog/emo-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            blog post
          </a>
          .
        </p>
      </article>
    </div>
  );
}
