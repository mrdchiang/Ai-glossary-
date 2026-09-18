import Link from "next/link";
import { loadGroups, loadTerms } from "../lib/terms";

export default function Home() {
  const groups = loadGroups();
  const terms = loadTerms().filter((t) => t.status === "published");

  return (
    <div className="py-16">
      <section className="max-w-2xl">
        <h1 className="font-serif text-5xl font-semibold tracking-tight">
          AI, explained like you&rsquo;re smart but busy.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-stone-600">
          Plain-language definitions of AI terms — each with a concrete example and a
          diagram showing how it connects to everything else. No jargon without an
          explanation.
        </p>
      </section>

      <section id="terms" className="mt-16 space-y-12">
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
                <h2 className="font-serif text-2xl font-semibold">{group.name}</h2>
              </div>
              <p className="mt-1 text-stone-500">{group.tagline}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {groupTerms.map((term) => (
                  <Link
                    key={term.id}
                    href={`/glossary/${term.id}`}
                    className="group rounded-xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md"
                  >
                    <div className="font-serif text-lg font-semibold group-hover:underline">
                      {term.name}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">{term.tagline}</p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <p className="mt-16 text-sm text-stone-500">
        {terms.length} terms published · {groups.length} groups · more on the way.
      </p>
    </div>
  );
}
