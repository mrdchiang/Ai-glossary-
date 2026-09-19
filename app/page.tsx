import Link from "next/link";
import { loadGroups, loadTerms } from "../lib/content";

export default function Home() {
  const groups = loadGroups();
  const terms = loadTerms().filter((t) => t.status === "published");
  const deepseek = terms.find((t) => t.id === "deepseek");

  return (
    <div className="py-14 sm:py-20">
      {/* ---------- hero ---------- */}
      <section className="rise-in max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-1.5 text-[13px] font-medium text-ink-soft">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          A field guide to AI, for the rest of us
        </div>
        <h1 className="mt-5 font-serif text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          AI, explained like you&rsquo;re smart but busy.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-soft">
          Plain-language definitions of AI terms — each with a concrete example and an
          interactive diagram showing how it connects to everything else. No jargon
          without an explanation.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/glossary"
            className="rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-paper transition-transform hover:-translate-y-px"
          >
            Browse the glossary
          </Link>
          <Link
            href="/glossary/deepseek"
            className="rounded-full border border-line bg-card px-6 py-3 text-[15px] font-semibold transition-all hover:border-accent hover:text-accent-deep"
          >
            See the DeepSeek visual
          </Link>
        </div>
      </section>

      {/* ---------- featured case study ---------- */}
      {deepseek && (
        <section className="rise-in rise-in-1 mt-16">
          <Link
            href="/glossary/deepseek"
            className="group block overflow-hidden rounded-2xl border border-line bg-card transition-all hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(28,25,23,0.1)]"
          >
            <div className="grid sm:grid-cols-[1fr_220px]">
              <div className="p-8">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                  Featured case study
                </div>
                <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight group-hover:text-accent-deep">
                  {deepseek.name}: what&rsquo;s actually inside an AI model
                </h2>
                <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
                  {deepseek.tagline} Follow one prompt through its machinery — then watch
                  what the prompt costs. The two-panel visual that makes token burn tangible.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-accent">
                  Open the interactive visual
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
              <div className="relative hidden items-center justify-center bg-accent-tint p-8 sm:flex">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden>
                  <circle cx="30" cy="30" r="16" fill="#fffdf9" stroke="#0f766e" strokeWidth="2.5" />
                  <circle cx="90" cy="30" r="16" fill="#fffdf9" stroke="#0f766e" strokeWidth="2.5" />
                  <circle cx="60" cy="88" r="16" fill="#0f766e" />
                  <path d="M44 36 52 74M76 36 68 74M46 30h28" stroke="#b8ab8f" strokeWidth="2.5" />
                  <circle cx="60" cy="88" r="5" fill="#fffdf9" />
                </svg>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ---------- term groups ---------- */}
      <section id="terms" className="rise-in rise-in-2 mt-20 space-y-12">
        {groups.map((group) => {
          const groupTerms = terms.filter((t) => t.group === group.id);
          if (groupTerms.length === 0) return null;
          return (
            <div key={group.id}>
              <div className="flex items-baseline gap-3">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                <h2 className="font-serif text-2xl font-semibold tracking-tight">{group.name}</h2>
                <span className="text-sm text-ink-faint">
                  {groupTerms.length} {groupTerms.length === 1 ? "term" : "terms"}
                </span>
              </div>
              <p className="mt-1 text-ink-soft">{group.tagline}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {groupTerms.map((term) => (
                  <Link
                    key={term.id}
                    href={`/glossary/${term.id}`}
                    className="group rounded-2xl border border-line bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(28,25,23,0.1)]"
                  >
                    <div className="font-serif text-xl font-semibold tracking-tight group-hover:text-accent-deep">
                      {term.name}
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{term.tagline}</p>
                    <span className="mt-3 inline-block text-sm font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
                      Read + see the diagram →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <p className="mt-16 text-sm text-ink-faint">
        {terms.length} terms published · {groups.length} groups · more on the way.
      </p>
    </div>
  );
}
