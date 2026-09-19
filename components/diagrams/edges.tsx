"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";

/**
 * Pill edge: the relationship line plus an HTML pill label rendered through
 * EdgeLabelRenderer. HTML labels paint in the edge-label layer *above* node
 * cards (SVG edge labels paint below them, so wide pills would tuck
 * half-behind the cards they sit between). The pill is pointer-transparent
 * so it never blocks node clicks.
 */
export function PillEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  style,
  markerEnd,
  data,
}: EdgeProps) {
  const curve = (data as { curve?: "bezier" | "smoothstep" } | undefined)?.curve ?? "smoothstep";
  const [path, labelX, labelY] =
    curve === "bezier"
      ? getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
      : getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      {label != null && label !== "" && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "Inter, ui-sans-serif, sans-serif",
              color: "#57534e",
              background: "#fffdf9",
              border: "1px solid #e8e0cf",
              borderRadius: 999,
              padding: "5px 10px",
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            {String(label)}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
