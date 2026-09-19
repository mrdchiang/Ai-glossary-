"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Group, Term } from "../../lib/terms";
import { TermDetail } from "./TermDetail";

export function GlossaryBrowser({
  terms,
  groups,
  activeSlug,
}: {
  terms: Term[];
  groups: Group[];
  activeSlug: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  const active = terms.find((t) => t.id === activeSlug) ?? terms[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return terms.filter((t) => {
      if (groupFilter !== "all" && t.group !== groupFilter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
      );
    });
  }, [terms, query, groupFilter]);

  const countFor = (groupId: string) =>
    terms.filter((t) => t.group === groupId).length;

  return (
    <div className="grid gap-10 py-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:py-14">
      {/* ---------- left: searchable list ---------- */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
            width="17"
            height="17"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden
          >
            <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="m12.5 12.5 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms…"
            aria-label="Search terms"
            className="w-full rounded-full border border-line bg-card py-3 pl-11 pr-4 text-[15px] shadow-[0_1px_4px_rgba(28,25,23,0.05)] outline-none transition-colors placeholder:text-ink-faint focus:border-accent"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <FilterChip
            active={groupFilter === "all"}
            onClick={() => setGroupFilter("all")}
            label="All"
            count={terms.length}
          />
          {groups.map((g) => (
            <FilterChip
              key={g.id}
              active={groupFilter === g.id}
              onClick={() => setGroupFilter(groupFilter === g.id ? "all" : g.id)}
              label={g.name}
              count={countFor(g.id)}
              color={g.color}
            />
          ))}
        </div>

        <ul className="term-list-scroll mt-4 space-y-2 lg:max-h-[62vh] lg:overflow-y-auto lg:pr-1">
          {filtered.map((t) => {
            const isActive = t.id === active.id;
            const g = groups.find((gg) => gg.id === t.group);
            return (
              <li key={t.id}>
                <button
                  onClick={() => router.push(`/glossary/${t.id}`)}
                  aria-current={isActive ? "true" : undefined}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    isActive
                      ? "border-accent/40 bg-accent-tint shadow-[0_2px_10px_rgba(15,118,110,0.12)]"
                      : "border-line bg-card hover:-translate-y-px hover:border-ink-faint/50 hover:shadow-[0_4px_12px_rgba(28,25,23,0.08)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: g?.color ?? "#a8a29e" }}
                    />
                    <span className="font-serif text-[17px] font-semibold leading-tight">
                      {t.name}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-soft">
                    {t.tagline}
                  </p>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-soft">
              No terms match “{query}”. Try a different word.
            </li>
          )}
        </ul>
      </aside>

      {/* ---------- right: term detail ---------- */}
      <div className="min-w-0">
        <TermDetail term={active} terms={terms} groups={groups} />
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all ${
        active
          ? "border-accent bg-accent text-white shadow-[0_2px_8px_rgba(15,118,110,0.25)]"
          : "border-line bg-card text-ink-soft hover:border-ink-faint/60 hover:text-ink"
      }`}
    >
      {color && !active && (
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      )}
      {label}
      <span className={active ? "text-white/75" : "text-ink-faint"}>{count}</span>
    </button>
  );
}
