import { stratify, tree as d3tree } from "d3-hierarchy";
import type { LayoutFn } from "./types";

const RADIUS_PER_DEPTH = 180;

export const radial: LayoutFn = (nodes) => {
  if (nodes.length === 0) return [];
  const root = stratify<{ id: string; parentId: string | null }>()
    .id((d) => d.id)
    .parentId((d) => d.parentId)(nodes);
  const maxDepth = Math.max(1, root.height);
  const layout = d3tree<{ id: string; parentId: string | null }>()
    .size([2 * Math.PI, maxDepth * RADIUS_PER_DEPTH])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / Math.max(a.depth, 1));
  layout(root);
  return root.descendants().map((d) => ({
    id: d.data.id,
    x: (d as any).y * Math.cos((d as any).x - Math.PI / 2),
    y: (d as any).y * Math.sin((d as any).x - Math.PI / 2),
  }));
};
