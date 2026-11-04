"use client";

import styles from "./page.module.css";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import type { LinkResponse } from "../api.ts";
import {
  getShortLinkDisplayURL,
  getShortLinkURL,
  submitLink,
  submitWithChallenge,
} from "../link-client.ts";

import { emojiAlphabet } from "../emoji-alphabet.ts";
import SmallUntilHover from "./small-until-hover";
import joinClasses from "../util/join-classes";

function generateRandomNumbers(n: number, min: number, max: number): number[] {
  return Array.from({ length: n }, () =>
    Math.floor(Math.random() * (max - min + 1) + min)
  );
}

const siteKey =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
  (process.env.NODE_ENV === "development"
    ? "1x00000000000000000000AA"
    : "0x4AAAAAAADqvMFKDAPy1IkK");

export default function Home() {
  const [randomEmojis, setRandomEmojis] = useState<string[]>([]);

  const turnstile = useRef<TurnstileInstance>(null);
  const submitting = useRef(false);
  const [token, setToken] = useState<string>("");
  const [userURL, setUserURL] = useState("");

  const [response, setResponse] = useState<LinkResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const copyOperation = useRef(0);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const key = response && "key" in response ? response.key : null;
  const emojiURL = key ? getShortLinkURL(window.location.origin, key) : null;
  const displayURL = key ? getShortLinkDisplayURL(window.location.origin, key) : null;

  useEffect(() => {
    const emojisToGenerate = 20;
    setRandomEmojis(
      generateRandomNumbers(emojisToGenerate, 0, emojiAlphabet.length - 1).map(
        (randomNumber) => emojiAlphabet[randomNumber]
      )
    );
  }, []);

  useEffect(() => () => {
    copyOperation.current++;
    clearTimeout(copyTimer.current);
  }, []);

  async function handleSubmitURL(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setResponse(null);
    copyOperation.current++;
    setCopyError("");
    setIsCopied(false);
    clearTimeout(copyTimer.current);
    try {
      const result = await submitWithChallenge(
        () => submitLink(userURL, token),
        () => {
          setToken("");
          turnstile.current?.reset();
        }
      );
      setResponse(result);
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  async function handleClickLink() {
    if (!emojiURL) return;
    const operation = ++copyOperation.current;
    setCopyError("");
    setIsCopied(false);
    try {
      await navigator.clipboard.writeText(emojiURL);
      if (operation !== copyOperation.current) return;
      setIsCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setIsCopied(false), 4000);
    } catch {
      if (operation !== copyOperation.current) return;
      setIsCopied(false);
      setCopyError("Unable to copy the link. Please copy the displayed URL.");
    }
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
      <output className="block" aria-live="polite">{copyError}</output>
      {response && "message" in response ? (
        <output className="mb-2 block w-full text-center" aria-live="polite">
          {response.message}
        </output>
      ) : (
        <button
          type="button"
          aria-label="Copy shortened URL"
          disabled={!emojiURL}
          className={joinClasses([
            styles["short-url"],
            "border-0 bg-transparent cursor-pointer",
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
          onClick={() => void handleClickLink()}
        >
          {displayURL}
        </button>
      )}

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

        <form
          onSubmit={(event) => void handleSubmitURL(event)}
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
                type="text"
                inputMode="url"
                autoComplete="url"
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
            <Turnstile
              ref={turnstile}
              aria-describedby="turnstile-label"
              options={{ appearance: "interaction-only" }}
              siteKey={siteKey}
              onError={() => setToken("")}
              onExpire={() => setToken("")}
              onSuccess={setToken}
            />
          </div>

          <button
            aria-label="Shorten URL"
            type="submit"
            disabled={!token || loading}
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
        </form>
      </section>

      <article
        className={joinClasses([
          "mt-4",
          "text-sm",
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
