import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";
import type { LayoutFn } from "./types";

type Sim = { id: string; x?: number; y?: number };

export const force: LayoutFn = (nodes) => {
  const simNodes: Sim[] = nodes.map((n) => ({ id: n.id }));
  const links = nodes
    .filter((n) => n.parentId)
    .map((n) => ({ source: n.parentId as string, target: n.id }));
  const sim = forceSimulation(simNodes as any)
    .force("link", forceLink(links).id((d: any) => d.id).distance(80).strength(0.7))
    .force("charge", forceManyBody().strength(-200))
    .force("collide", forceCollide(40))
    .force("center", forceCenter(0, 0))
    .stop();
  for (let i = 0; i < 300; i++) sim.tick();
  return simNodes.map((n) => ({ id: n.id, x: n.x ?? 0, y: n.y ?? 0 }));
};
