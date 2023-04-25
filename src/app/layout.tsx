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
        <div className={styles["app-layout"]}>
          <header></header>
          <main role="main">{children}</main>
          <footer className={styles.footer}>
            © {new Date().getFullYear()} Made by{" "}
            <a href="https://ericbaer.com/">Eric Baer</a> with 🧑‍🔬.
          </footer>
        </div>
      </body>
    </html>
  );
}
