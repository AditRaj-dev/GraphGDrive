import { describe, it, expect } from "vitest";
import { hierarchical } from "../../src/layouts/hierarchical";

describe("hierarchical layout", () => {
  it("places root above its children", () => {
    const positions = hierarchical([
      { id: "r", parentId: null, isFolder: true },
      { id: "a", parentId: "r", isFolder: false },
      { id: "b", parentId: "r", isFolder: false },
    ]);
    const byId = Object.fromEntries(positions.map(p => [p.id, p]));
    expect(byId.r.y).toBeLessThan(byId.a.y);
    expect(byId.r.y).toBeLessThan(byId.b.y);
    expect(byId.a.x).not.toBe(byId.b.x);
  });
});
