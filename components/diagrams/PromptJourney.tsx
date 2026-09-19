"use client";

import { useEffect, useRef, useState } from "react";
import type { Diagram } from "../../lib/terms";

type Panel = Extract<Diagram, { kind: "model" }>["panels"][number];

/** Illustrative per-million-token rates (DeepSeek-V3-class, cache miss). */
const INPUT_RATE = 0.27;
const OUTPUT_RATE = 1.1;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function useAnimatedNumber(value: number, reduced: boolean): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    const to = value;
    fromRef.current = to;
    if (from === to) return;
    const start = performance.now();
    const dur = 450;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);
  return display;
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const JOURNEY_SHORT_LABEL: Record<string, string> = {
  words: "Your words",
  tokens: "Tokens",
  embedding: "Embed",
  routing: "MoE",
  attention: "Attention",
  decode: "Decode",
  response: "Reply",
};

function promptFor(v: number): { text: string; pasted: boolean } {
  if (v < 0.34)
    return { text: "\u201CSummarize the pricing section in 5 bullets.\u201D", pasted: false };
  if (v < 0.67)
    return { text: "\u201CCan you summarize this document for me?\u201D", pasted: false };
  return { text: "\u201Csummarize this 40-page contract??\u201D", pasted: true };
}

export function PromptJourney({ panel }: { panel: Panel }) {
  const [vagueness, setVagueness] = useState(0.7);
  const reduced = usePrefersReducedMotion();

  // The model: vagueness compounds. A vague prompt usually arrives with a
  // pasted document (input balloons), forces the model to guess (reasoning
  // tokens grow quadratically), and produces a hedged, over-long answer.
  const input = 12 + vagueness * 11988;
  const reasoning = vagueness * vagueness * 1600;
  const output = 60 + vagueness * 1940;
  const cost = (input / 1e6) * INPUT_RATE + ((reasoning + output) / 1e6) * OUTPUT_RATE;
  const baseCost = (12 / 1e6) * INPUT_RATE + (60 / 1e6) * OUTPUT_RATE;
  const multiplier = cost / baseCost;

  const aInput = useAnimatedNumber(input, reduced);
  const aReasoning = useAnimatedNumber(reasoning, reduced);
  const aOutput = useAnimatedNumber(output, reduced);
  const aCost = useAnimatedNumber(cost, reduced);
  const aMult = useAnimatedNumber(multiplier, reduced);

  const prompt = promptFor(vagueness);

  const annotations: Record<string, string> = {
    words: "you type",
    tokens: `${fmt(aInput)} in`,
    embedding: "meaning \u2192 numbers",
    routing: "~5% of the model wakes up",
    attention: `re-reads ${fmt(aInput)} from compressed memory`,
    decode: `+${fmt(aReasoning)} thinking \u00B7 ${fmt(aOutput)} out`,
    response: `${fmt(aOutput)} tokens`,
  };

  return (
    <div>
      {/* ---- vagueness control ---- */}
      <div className="rounded-xl border border-line bg-card p-5">
        <div className="flex items-baseline justify-between gap-4">
          <label
            htmlFor="vagueness"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft"
          >
            How vague is the prompt?
          </label>
          <span className="font-serif text-sm italic text-ink-soft">
            drag me — watch the tokens
          </span>
        </div>
        <input
          id="vagueness"
          type="range"
          min={0}
          max={100}
          value={Math.round(vagueness * 100)}
          onChange={(e) => setVagueness(Number(e.target.value) / 100)}
          className="vagueness mt-3 w-full"
          aria-valuetext={vagueness < 0.34 ? "precise" : vagueness < 0.67 ? "middling" : "vague"}
        />
        <div className="mt-1.5 flex justify-between text-xs font-medium text-ink-soft">
          <span>Precise</span>
          <span>Vague</span>
        </div>

        <div className="mt-4 rounded-lg bg-paper-deep/60 px-4 py-3">
          <div className="font-serif text-lg leading-snug">{prompt.text}</div>
          {prompt.pasted && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-wash px-3 py-1 text-xs font-semibold text-[#92400e]">
              <span aria-hidden>📄</span> + 40-page PDF pasted · ~{fmt(11988)} tokens of context
            </div>
          )}
        </div>
      </div>

      {/* ---- pipeline: circles in a vertical chain ---- */}
      <div className="mt-5 px-1 pb-2 pt-4">
        <ol className="flex flex-col items-center">
          {panel.nodes.map((node, i) => {
            const isDecode = node.id === "decode";
            const isLast = i === panel.nodes.length - 1;
            return (
              <li key={node.id} className="flex flex-col items-center">
                <div className="flex flex-col items-center">
                  <div
                    className="relative flex h-[112px] w-[112px] shrink-0 items-center justify-center rounded-full bg-card text-center shadow-[0_2px_12px_rgba(28,25,23,0.07)]"
                    style={{ border: `3px solid ${isDecode ? "#b45309" : "#0f766e"}` }}
                  >
                    {isDecode && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#b45309] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        latency lives here
                      </span>
                    )}
                    <span className="px-3 font-serif text-sm font-semibold leading-tight text-ink">
                      {JOURNEY_SHORT_LABEL[node.id] ?? node.label}
                    </span>
                  </div>
                  <div className="mt-2.5 max-w-[300px] text-center">
                    <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-0.5 font-serif text-[15px] font-semibold leading-tight text-ink">
                      {node.label}
                    </div>
                    <div
                      className={`mt-1 text-xs font-medium leading-snug tabular-nums ${
                        isDecode ? "text-[#92400e]" : "text-accent-deep"
                      }`}
                    >
                      {annotations[node.id] ?? node.blurb}
                    </div>
                  </div>
                </div>
                {!isLast && (
                  <div className="flex items-center py-2 text-accent" aria-hidden>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <path
                        d="M4.5 7 11 14.5 17.5 7"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* ---- the bill ---- */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-line bg-card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Input tokens
          </div>
          <div className="mt-1 font-serif text-2xl font-semibold tabular-nums sm:text-3xl">
            {fmt(aInput)}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Thinking + output
          </div>
          <div className="mt-1 font-serif text-2xl font-semibold tabular-nums sm:text-3xl">
            {fmt(aReasoning + aOutput)}
          </div>
        </div>
        <div className="rounded-xl border border-accent/30 bg-accent-tint p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-deep">
            Est. cost
          </div>
          <div className="mt-1 font-serif text-2xl font-semibold tabular-nums text-accent-deep sm:text-3xl">
            ${aCost.toFixed(4)}
          </div>
        </div>
      </div>

      {/* ---- burn meter ---- */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between text-xs font-medium">
          <span className="uppercase tracking-[0.12em] text-ink-soft">Token burn</span>
          <span className="font-serif text-base font-semibold text-[#b45309]">
            ≈ {aMult < 10 ? aMult.toFixed(1) : Math.round(aMult)}× the cost of a precise prompt
          </span>
        </div>
        <div
          className="mt-2 h-3 overflow-hidden rounded-full bg-paper-deep"
          role="img"
          aria-label={`Token burn at ${Math.round(vagueness * 100)} percent`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent via-[#d97706] to-[#dc2626] transition-[width] duration-300"
            style={{ width: `${Math.round(vagueness * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          Illustrative rates — the point is the shape of the curve, not the pennies.
        </p>
      </div>

      {panel.annotation && (
        <div className="mt-5 rounded-xl border border-amber-line bg-amber-wash p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#92400e]">
            Token-burn note
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-[#78350f]">{panel.annotation}</p>
        </div>
      )}
    </div>
  );
}
