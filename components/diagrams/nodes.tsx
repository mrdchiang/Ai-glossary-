"use client";

import type { NodeProps } from "@xyflow/react";
import { kindAccent, type FlowNodeData } from "../../lib/diagrams";

function useNodeData(props: NodeProps) {
  return props.data as unknown as FlowNodeData;
}

const cardBase =
  "rounded-2xl border bg-card text-left shadow-[0_2px_12px_rgba(28,25,23,0.07)] transition-shadow";

/** Term node: group color dot, serif name, tagline. Used by the auto graph. */
export function TermNode(props: NodeProps) {
  const d = useNodeData(props);
  const isCenter = d.variant === "center";
  return (
    <div
      className={`${cardBase} ${isCenter ? "border-accent/40 ring-2 ring-accent/15" : "border-line"} ${
        d.clickable ? "cursor-pointer hover:shadow-[0_6px_20px_rgba(15,118,110,0.18)]" : ""
      }`}
      style={{ width: isCenter ? 300 : 250 }}
    >
      <div
        className="h-1.5 rounded-t-2xl"
        style={{ backgroundColor: d.groupColor ?? "#a8a29e" }}
      />
      <div className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: d.groupColor ?? "#a8a29e" }}
          />
          {d.groupName ?? "Term"}
        </div>
        <div
          className={`mt-1.5 font-serif font-semibold leading-tight tracking-tight ${
            isCenter ? "text-2xl" : "text-lg"
          }`}
        >
          {d.label}
        </div>
        {d.blurb && (
          <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">{d.blurb}</p>
        )}
        {d.clickable && (
          <div className="mt-2 text-[12px] font-semibold text-accent">Open term →</div>
        )}
      </div>
    </div>
  );
}

/** Info node: label + blurb card with a kind-colored spine. Custom + model panels. */
export function InfoNode(props: NodeProps) {
  const d = useNodeData(props);
  const isNote = d.variant === "note";
  const accent = isNote ? "#b45309" : kindAccent(d.kind);
  return (
    <div
      className={`${cardBase} ${isNote ? "border-amber-line bg-amber-wash" : "border-line"}`}
      style={{ width: 270 }}
    >
      <div className="flex">
        <div
          className="w-1.5 shrink-0 rounded-l-2xl"
          style={{ backgroundColor: accent }}
        />
        <div className="px-5 py-4">
          {d.kind && !isNote && (
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: accent }}
            >
              {d.kind}
            </div>
          )}
          {isNote && (
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#b45309]">
              One-time cost
            </div>
          )}
          <div className="mt-1 font-serif text-lg font-semibold leading-tight tracking-tight">
            {d.label}
          </div>
          {d.blurb && (
            <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">{d.blurb}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Circle node: classic node-link circle — paper fill, colored ring, short
 *  label inside, full label + blurb captioned beneath. Used by the DeepSeek
 *  model panel. The caption is absolutely positioned so React Flow edges
 *  terminate exactly on the circle boundary rather than on caption text. */
export function CircleNode(props: NodeProps) {
  const d = useNodeData(props);
  const size = d.size ?? 150;
  const isNote = d.variant === "note";
  const ring = isNote ? "#b45309" : "#0f766e";
  const innerFont = Math.max(15, Math.round(size * 0.11));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full bg-[#fffdf9] text-center shadow-[0_2px_14px_rgba(28,25,23,0.08)]"
        style={{ border: `3px solid ${ring}` }}
      >
        <span
          className="px-4 font-serif font-semibold leading-tight text-ink"
          style={{ fontSize: innerFont }}
        >
          {d.shortLabel ?? d.label}
        </span>
      </div>
      <div className="pointer-events-none absolute left-1/2 top-full z-10 w-max max-w-[230px] -translate-x-1/2 pt-2.5 text-center">
        {isNote && (
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b45309]">
            One-time cost
          </div>
        )}
        <div className="font-serif text-[15px] font-semibold leading-tight text-ink">
          {d.label}
        </div>
        {d.blurb && (
          <p className="mt-1 text-xs leading-snug text-ink-soft">{d.blurb}</p>
        )}
      </div>
    </div>
  );
}
