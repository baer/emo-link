"use client";

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
        className={`mx-12 mb-1 rounded-[20px] bg-[#4caf50] px-[10px] py-[5px] text-center text-base text-white transition-[opacity,visibility,transform] duration-500 lg:mb-4 ${isCopied ? "visible animate-pop opacity-100" : "invisible opacity-0"}`}
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
          className="link mb-2 w-full cursor-pointer border-0 bg-transparent text-center text-base md:mb-10 md:text-2xl lg:text-4xl"
          onClick={() => void handleClickLink()}
        >
          {displayURL}
        </button>
      )}

      <section className="container mx-auto flex flex-col items-center rounded-lg bg-white p-4 text-gray-600 shadow-md md:flex-row">
        <div className="mb-2 min-h-40 w-5/6 text-center md:mb-0 md:min-h-0 md:w-1/2 lg:w-full lg:max-w-lg">
          <p>
            {randomEmojis.map((emoji, index) => (
              <span
                key={index}
                className="m-4 text-xl leading-10 hover:m-[0.63rem] hover:text-[2rem] hover:leading-normal"
              >
                {emoji}
              </span>
            ))}
          </p>
        </div>

        <form
          onSubmit={(event) => void handleSubmitURL(event)}
          className="flex flex-col items-center text-center md:w-1/2 md:items-start md:gap-8 md:pl-16 md:text-left lg:grow lg:pl-24"
        >
          <div className="w-full p-2">
            <div className="relative">
              <label
                id="url-input-label"
                htmlFor="url"
                className="sr-only"
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
                className="w-full border-2 border-dashed border-dark bg-gray-100/50 px-3 py-1 text-base leading-8 text-gray-700 shadow-md transition-colors duration-200 ease-in-out focus:bg-white focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-highlight"
              />
            </div>
          </div>

          <div className="my-4 rounded-sm bg-gray-100 p-2">
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
            className="w-full cursor-pointer border-0 bg-primary px-6 py-2 text-lg font-bold text-light uppercase shadow-md text-shadow-[0_1px_1px_rgb(0_0_0_/_0.1)] transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-secondary focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-highlight"
          >
            Submit
          </button>
        </form>
      </section>

      <article className="mt-4 text-center text-sm font-medium">
        <p>
          To learn how and why this works, check out my{" "}
          <a
            className="link m-0"
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
