import { describe, it, expect } from "vitest";
import { radial } from "../../src/layouts/radial";

describe("radial layout", () => {
  it("places the root near the origin and children at radius > 0", () => {
    const pos = radial([
      { id: "r", parentId: null, isFolder: true },
      { id: "a", parentId: "r", isFolder: false },
      { id: "b", parentId: "r", isFolder: false },
    ]);
    const byId = Object.fromEntries(pos.map(p => [p.id, p]));
    const dist = (p: { x: number; y: number }) => Math.hypot(p.x, p.y);
    expect(dist(byId.r)).toBeLessThan(1);
    expect(dist(byId.a)).toBeGreaterThan(50);
    expect(dist(byId.b)).toBeGreaterThan(50);
  });
});
