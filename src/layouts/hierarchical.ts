import dagre from "@dagrejs/dagre";
import type { LayoutFn } from "./types";

const NODE_W = 180;
const NODE_H = 56;

export const hierarchical: LayoutFn = (nodes) => {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 24, ranksep: 64 });
  for (const n of nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const n of nodes) if (n.parentId) g.setEdge(n.parentId, n.id);
  dagre.layout(g);
  return nodes.map((n) => {
    const { x, y } = g.node(n.id);
    return { id: n.id, x: x - NODE_W / 2, y: y - NODE_H / 2 };
  });
};
