import dagre from "@dagrejs/dagre";
import type { LayoutFn } from "./types";

const DEFAULT_W = 200;
const DEFAULT_H = 52;

export const hierarchical: LayoutFn = (nodes) => {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 48, ranksep: 80 });
  for (const n of nodes) {
    g.setNode(n.id, { width: n.width ?? DEFAULT_W, height: n.height ?? DEFAULT_H });
  }
  for (const n of nodes) if (n.parentId) g.setEdge(n.parentId, n.id);
  dagre.layout(g);
  return nodes.map((n) => {
    const { x, y } = g.node(n.id);
    const w = n.width ?? DEFAULT_W;
    const h = n.height ?? DEFAULT_H;
    return { id: n.id, x: x - w / 2, y: y - h / 2 };
  });
};
