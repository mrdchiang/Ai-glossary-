import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Glossary — AI terms, explained like you're smart but busy",
  description:
    "Plain-language AI definitions with interactive relationship diagrams. Built for curious non-experts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#faf7f1] text-stone-900 antialiased">
        <header className="border-b border-stone-200">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-serif text-xl font-semibold tracking-tight">
              AI Glossary
            </Link>
            <nav className="text-sm">
              <Link href="/#terms" className="text-stone-600 hover:text-stone-900">
                Browse terms
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6">{children}</main>
        <footer className="mt-24 border-t border-stone-200">
          <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-stone-500">
            Plain-language AI, one term at a time.
          </div>
        </footer>
      </body>
    </html>
  );
}
