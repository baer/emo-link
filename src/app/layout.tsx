import "./globals.css";

import { Inter } from "next/font/google";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

// The static export displays the year at build time.
const BUILD_YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: "EmoLink",
  description:
    "A collision-free, emoji-based URL shortener built for David Howell Evans",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col gap-1 md:gap-4">
          <header className="mx-auto mt-4 w-full max-w-[90ch] text-center lg:my-5">
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl md:mb-5">
              EmoLink
            </h1>
            <p className="mx-auto text-base font-medium leading-relaxed lg:w-3/4 xl:w-2/4">
              An emoji-based URL shortener
            </p>
          </header>

          <main className="mx-auto w-full max-w-[90ch]">{children}</main>

          <footer className="mt-auto mb-4 pt-8 text-center text-sm font-medium text-dark">
            © {BUILD_YEAR} Made by{" "}
            <a className="link" href="https://ericbaer.com/">
              Eric Baer
            </a>{" "}
            with 🧑‍🔬.
          </footer>
        </div>
      </body>
    </html>
  );
}
