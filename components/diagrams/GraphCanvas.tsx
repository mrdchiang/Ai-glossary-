"use client";

import {
  Background,
  BackgroundVariant,
  ReactFlow,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import { InfoNode, TermNode } from "./nodes";
import type { FlowNode, FlowNodeData } from "../../lib/diagrams";

const nodeTypes: NodeTypes = {
  termNode: TermNode,
  infoNode: InfoNode,
};

interface GraphCanvasProps {
  nodes: FlowNode[];
  edges: Edge[];
  /** Called with a term id when a clickable term node is pressed. */
  onTermClick?: (termId: string) => void;
  height?: number;
}

/** Shared React Flow wrapper: styled background, pristine layout, pill labels. */
export function GraphCanvas({ nodes, edges, onTermClick, height = 440 }: GraphCanvasProps) {
  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-line bg-paper-deep/40"
      style={{ height }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          const data = node.data as unknown as FlowNodeData;
          if (data.clickable && data.termId && onTermClick) {
            onTermClick(data.termId);
          }
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.22, maxZoom: 1 }}
        minZoom={0.35}
        maxZoom={1.6}
        proOptions={{ hideAttribution: false }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.5}
          color="#ddd2ba"
          bgColor="transparent"
        />
      </ReactFlow>
    </div>
  );
}
