import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";
import type { LayoutFn } from "./types";

type Sim = { id: string; x?: number; y?: number; r: number };

export const force: LayoutFn = (nodes) => {
  const simNodes: Sim[] = nodes.map((n) => ({
    id: n.id,
    // collision radius = half the diagonal of the node bounding box
    r: Math.hypot((n.width ?? 200) / 2, (n.height ?? 52) / 2) + 12,
  }));
  const links = nodes
    .filter((n) => n.parentId)
    .map((n) => ({ source: n.parentId as string, target: n.id }));
  const sim = forceSimulation(simNodes as any)
    .force("link", forceLink(links).id((d: any) => d.id).distance(160).strength(0.5))
    .force("charge", forceManyBody().strength(-500))
    .force("collide", forceCollide((d: any) => (d as Sim).r))
    .force("center", forceCenter(0, 0))
    .stop();
  for (let i = 0; i < 400; i++) sim.tick();
  return simNodes.map((n) => ({ id: n.id, x: n.x ?? 0, y: n.y ?? 0 }));
};
