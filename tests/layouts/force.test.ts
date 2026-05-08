import { describe, it, expect } from "vitest";
import { force } from "../../src/layouts/force";

describe("force layout", () => {
  it("returns one position per node and separates connected nodes", () => {
    const pos = force([
      { id: "r", parentId: null, isFolder: true },
      { id: "a", parentId: "r", isFolder: false },
      { id: "b", parentId: "r", isFolder: false },
    ]);
    expect(pos).toHaveLength(3);
    const ids = new Set(pos.map(p => p.id));
    expect(ids).toEqual(new Set(["r", "a", "b"]));
    const byId = Object.fromEntries(pos.map(p => [p.id, p]));
    expect(Math.hypot(byId.a.x - byId.b.x, byId.a.y - byId.b.y)).toBeGreaterThan(10);
  });
});
