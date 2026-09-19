import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Glossary — AI terms, explained like you're smart but busy",
  description:
    "Plain-language AI definitions with interactive relationship diagrams. Built for curious non-experts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen font-sans text-ink antialiased">
        <header className="border-b border-line bg-paper/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-serif text-lg font-bold text-white">
                ✳
              </span>
              <span className="font-serif text-xl font-semibold tracking-tight">
                AI Glossary
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link href="/glossary" className="text-ink-soft transition-colors hover:text-ink">
                Browse terms
              </Link>
              <Link
                href="/glossary/deepseek"
                className="hidden rounded-full border border-line bg-card px-4 py-1.5 transition-colors hover:border-accent hover:text-accent-deep sm:inline-block"
              >
                DeepSeek case study
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6">{children}</main>
        <footer className="mt-24 border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
            <p className="font-serif text-base text-ink">Plain-language AI, one term at a time.</p>
            <p>Definitions are written for curious non-experts. Technical depth lives in the footnotes.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
