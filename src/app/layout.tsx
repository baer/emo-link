import joinClasses from "@/util/join-classes";
import "./globals.css";
import styles from "./layout.module.css";

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
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
        <div
          className={joinClasses([styles["app-layout"], "gap-1", "md:gap-4"])}
        >
          <header>
            <div className="text-center mt-4 mb-0 lg:my-5">
              <h1
                className={joinClasses([
                  "font-semibold",
                  "mb-0",
                  "md:mb-5",
                  "text-2xl",
                  "sm:text-3xl",
                  "text-center",
                  "text-gray-900",
                  "title-font",
                ])}
              >
                EmoLink
              </h1>
              <p
                className={joinClasses([
                  "text-base",
                  "leading-relaxed",
                  "xl:w-2/4",
                  "lg:w-3/4 mx-auto",
                  "font-medium",
                ])}
              >
                An emoji-based URL shortener
              </p>
            </div>
          </header>

          <main role="main">{children}</main>

          <footer
            className={joinClasses([
              styles.footer,
              "text-center",
              "text-sm",
              "font-medium",
            ])}
          >
            © {new Date().getFullYear()} Made by{" "}
            <a href="https://ericbaer.com/">Eric Baer</a> with 🧑‍🔬.
          </footer>
        </div>
      </body>
    </html>
  );
}
